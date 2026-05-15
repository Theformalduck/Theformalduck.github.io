import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  async function syncSubscription(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;
    if (!userId) return;
    const status = subscription.status;
    const isPro = status === "active" || status === "trialing";
    const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: status,
        plan: isPro ? "pro" : "free",
        currentPeriodEnd,
      },
    });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        await syncSubscription(sub);

        // Credit referrer: if this user was referred and this is their first paid sub
        const userId = sub.metadata?.userId;
        if (userId) {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { referredBy: true },
          });
          if (user?.referredBy) {
            await prisma.user.update({
              where: { id: user.referredBy },
              data: { referralCount: { increment: 1 } },
            });
            // Apply 1-month free coupon to referrer's subscription if configured
            const couponId = process.env.STRIPE_REFERRAL_COUPON_ID;
            if (couponId) {
              const referrer = await prisma.user.findUnique({
                where: { id: user.referredBy },
                select: { stripeSubscriptionId: true },
              });
              if (referrer?.stripeSubscriptionId) {
                try {
                  await stripe.subscriptions.update(referrer.stripeSubscriptionId, {
                    discounts: [{ coupon: couponId }],
                  });
                } catch {
                  // Non-fatal: coupon application failed
                }
              }
            }
          }
        }
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const sub = event.data.object as Stripe.Subscription;
      await syncSubscription(sub);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeSubscriptionId: null,
            subscriptionStatus: "canceled",
            plan: "free",
            currentPeriodEnd: null,
          },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
