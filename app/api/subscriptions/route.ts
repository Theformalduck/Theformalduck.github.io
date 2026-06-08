import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role") ?? "subscriber";

    if (role === "creator") {
      const subs = await db.subscription.findMany({
        where: { creatorId: session.user.id },
        include: {
          subscriber: { select: { id: true, name: true, username: true, image: true, email: true } },
          product: { select: { id: true, name: true, price: true, billingInterval: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(subs);
    }

    const subs = await db.subscription.findMany({
      where: { subscriberId: session.user.id },
      include: {
        product: { select: { id: true, name: true, price: true, billingInterval: true, images: true } },
        creator: { select: { id: true, name: true, username: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(subs);
  } catch (err) {
    console.error("[subscriptions GET]", err);
    return NextResponse.json({ error: "Failed to load subscriptions" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!stripe) return NextResponse.json({ error: "Payments not configured" }, { status: 503 });

    const { subscriptionId } = await req.json();
    if (!subscriptionId) return NextResponse.json({ error: "subscriptionId required" }, { status: 400 });

    const sub = await db.subscription.findUnique({ where: { id: subscriptionId } });
    if (!sub || sub.subscriberId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true });
    await db.subscription.update({
      where: { id: subscriptionId },
      data: { cancelAtPeriodEnd: true },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[subscriptions DELETE]", err);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }
}
