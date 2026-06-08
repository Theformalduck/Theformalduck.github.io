import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripeEnabled, refundPayment } from "@/lib/stripe";
import { getActiveAccount, can } from "@/lib/team";

export async function POST(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await getActiveAccount(session.user.id);
  if (!can(account, "orders")) return NextResponse.json({ error: "You don't have permission to manage orders." }, { status: 403 });

  if (!stripeEnabled) return NextResponse.json({ error: "Payments not configured" }, { status: 503 });

  const { id } = await props.params;

  const order = await db.order.findUnique({
    where: { id },
    include: { items: { include: { product: { select: { userId: true } } } } },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const isSeller = order.items.some((item) => item.product?.userId === account.ownerId);
  if (!isSeller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (order.status === "REFUNDED") {
    return NextResponse.json({ error: "Order is already refunded" }, { status: 400 });
  }

  if (!order.stripePaymentIntentId) {
    return NextResponse.json({ error: "No Stripe payment found for this order" }, { status: 400 });
  }

  try {
    await refundPayment(order.stripePaymentIntentId);
    const updated = await db.order.update({ where: { id }, data: { status: "REFUNDED" } });
    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("[refund]", err);
    return NextResponse.json({ error: err?.message ?? "Refund failed" }, { status: 500 });
  }
}
