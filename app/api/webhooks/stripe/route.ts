import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { fulfillStoreOrder, fulfillCampaignBacking } from "@/lib/fulfill";

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: any;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("[stripe webhook] signature verification failed:", err.message);
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  // ── Checkout completed: backstop fulfillment ──────────────────────────────
  // The buyer's return to the success page normally triggers /api/orders/confirm.
  // If they never return (closed tab, async/delayed payment method), this webhook
  // is the reliable path. Both read the same `pendingCheckout` row (keyed by the
  // session id) and run the idempotent fulfill.ts helpers, so a race between the
  // two can't double-create an order or pledge.
  if (event.type === "checkout.session.completed" && (event.data.object as any).mode !== "subscription") {
    const session = event.data.object as any;
    if (session.payment_status !== "paid") return NextResponse.json({ received: true });

    const pending = await db.pendingCheckout.findUnique({ where: { id: session.id } });
    if (!pending) return NextResponse.json({ received: true }); // confirm already cleaned it up, or not ours

    const data = pending.data as any;
    const amount = (session.amount_total ?? 0) / 100;
    const paymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;

    try {
      if (pending.kind === "campaign") {
        await fulfillCampaignBacking({
          stripeSessionId: session.id,
          campaignId: data.campaignId,
          rewardId: data.rewardId ?? null,
          amount: amount || data.amount,
          buyerId: data.buyerId ?? null,
        });
      } else {
        const sd = session.shipping_details ?? session.collected_information?.shipping_details ?? null;
        const cd = session.customer_details ?? null;
        const addr = sd?.address ?? cd?.address ?? null;
        const shippingAddress = addr
          ? {
              name: sd?.name ?? cd?.name ?? null, phone: cd?.phone ?? null, email: cd?.email ?? null,
              line1: addr.line1 ?? null, line2: addr.line2 ?? null, city: addr.city ?? null,
              state: addr.state ?? null, postalCode: addr.postal_code ?? null, country: addr.country ?? null,
            }
          : null;
        await fulfillStoreOrder({
          stripeSessionId: session.id,
          stripePaymentIntentId: paymentIntentId,
          items: data.items,
          total: amount || data.total,
          buyerId: data.buyerId ?? null,
          buyerEmail: session.customer_details?.email ?? null,
          discountCode: data.discountCode ?? null,
          creatorUsername: data.creatorUsername ?? null,
          shippingAddress,
        });
      }
      await db.pendingCheckout.delete({ where: { id: session.id } }).catch(() => {});
    } catch (e) {
      // Surface a 500 so Stripe retries the webhook rather than dropping the order.
      console.error("[stripe webhook] fulfillment failed:", e);
      return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  }

  // ── Subscription created via checkout ────────────────────────────────────
  if (event.type === "checkout.session.completed" && (event.data.object as any).mode === "subscription") {
    const session = event.data.object as any;
    const { buyerId, productId, creatorId } = session.metadata ?? {};
    if (buyerId && productId && creatorId && session.subscription) {
      const existing = await db.subscription.findUnique({ where: { stripeSubscriptionId: session.subscription } });
      if (!existing) {
        const stripeSub = await stripe!.subscriptions.retrieve(session.subscription);
        await db.subscription.create({
          data: {
            subscriberId: buyerId,
            productId,
            creatorId,
            stripeSubscriptionId: session.subscription,
            stripeCustomerId: typeof stripeSub.customer === "string" ? stripeSub.customer : stripeSub.customer.id,
            status: stripeSub.status,
            currentPeriodEnd: new Date((stripeSub as any).current_period_end * 1000),
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
          },
        });
      }
    }
  }

  // ── Subscription updated (renewal, cancellation toggle, etc.) ────────────
  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const stripeSub = event.data.object as any;
    await db.subscription.updateMany({
      where: { stripeSubscriptionId: stripeSub.id },
      data: {
        status: event.type === "customer.subscription.deleted" ? "cancelled" : stripeSub.status,
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      },
    });
  }

  // ── Invoice paid (subscription renewal) ───────────────────────────────────
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as any;
    if (invoice.subscription) {
      await db.subscription.updateMany({
        where: { stripeSubscriptionId: invoice.subscription },
        data: { status: "active" },
      });
    }
  }

  // ── Invoice payment failed ────────────────────────────────────────────────
  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as any;
    if (invoice.subscription) {
      await db.subscription.updateMany({
        where: { stripeSubscriptionId: invoice.subscription },
        data: { status: "past_due" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
