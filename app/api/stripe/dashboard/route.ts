import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST() {
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { stripeAccountId: true },
  });

  if (!user?.stripeAccountId) {
    return NextResponse.json({ error: "No connected Stripe account" }, { status: 400 });
  }

  try {
    const loginLink = await stripe.accounts.createLoginLink(user.stripeAccountId);
    return NextResponse.json({ url: loginLink.url });
  } catch (err) {
    console.error("[stripe/dashboard POST]", err);
    return NextResponse.json({ error: "Failed to generate dashboard link" }, { status: 500 });
  }
}
