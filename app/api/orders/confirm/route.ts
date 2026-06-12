import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripeEnabled, retrieveSession } from "@/lib/stripe";
import { fulfillStoreOrder, fulfillCampaignBacking } from "@/lib/fulfill";

// Called from the store / campaign return page after the buyer completes Stripe
// Checkout. Verifies the session was paid and fulfills it (store order or
// campaign pledge). Idempotent on the session id so a refresh or webhook can't
// double-create.
export async function POST(req: NextRequest) {
  if (!stripeEnabled) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

  const { sessionId } = await req.json();
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

  const existingOrder = await db.order.findFirst({ where: { stripeSessionId: sessionId } });
  if (existingOrder) return NextResponse.json({ ok: true, orderId: existingOrder.id });

  const pending = await db.pendingCheckout.findUnique({ where: { id: sessionId } });
  if (!pending) {
    return NextResponse.json({ error: "Unknown or expired checkout" }, { status: 400 });
  }

  let paid = false;
  let paymentIntentId: string | null = null;
  let buyerEmail: string | null = null;
  let amount = 0;
  let shipping: Awaited<ReturnType<typeof retrieveSession>>["shipping"] = null;
  try {
    const s = await retrieveSession(sessionId);
    paid = s.paid;
    paymentIntentId = s.paymentIntentId;
    buyerEmail = s.buyerEmail;
    amount = s.amount;
    shipping = s.shipping;
  } catch (err: any) {
    console.error("[orders/confirm retrieve]", err);
    return NextResponse.json({ error: err?.message ?? "Failed to verify payment" }, { status: 400 });
  }

  if (!paid) {
    return NextResponse.json({ error: "Payment was not completed." }, { status: 400 });
  }

  const data = pending.data as any;

  if (pending.kind === "campaign") {
    await fulfillCampaignBacking({
      stripeSessionId: sessionId,
      campaignId: data.campaignId,
      rewardId: data.rewardId ?? null,
      amount: amount || data.amount,
      buyerId: data.buyerId ?? null,
    });
    await db.pendingCheckout.delete({ where: { id: sessionId } }).catch(() => {});
    return NextResponse.json({ ok: true, kind: "campaign" });
  }

  const result = await fulfillStoreOrder({
    stripeSessionId: sessionId,
    stripePaymentIntentId: paymentIntentId,
    items: data.items,
    total: amount || data.total,
    buyerId: data.buyerId ?? null,
    buyerEmail,
    discountCode: data.discountCode ?? null,
    creatorUsername: data.creatorUsername ?? null,
    shippingAddress: shipping ?? null,
  });

  await db.pendingCheckout.delete({ where: { id: sessionId } }).catch(() => {});

  return NextResponse.json({ ok: true, orderId: result.orderId });
}
