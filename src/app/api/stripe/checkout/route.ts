import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const annual = body.annual === true;

  const priceId = annual
    ? (process.env.STRIPE_PRO_ANNUAL_PRICE_ID || process.env.STRIPE_PRO_PRICE_ID!)
    : process.env.STRIPE_PRO_PRICE_ID!;

  // Find or create Stripe customer
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
  }

  // Apply referral coupon if user was referred and hasn't paid before
  const referralCoupon = process.env.STRIPE_REFERRAL_COUPON_ID;
  const discounts = referralCoupon && user.referredBy && !user.subscriptionStatus
    ? [{ coupon: referralCoupon }]
    : undefined;

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/settings?tab=billing&upgraded=1`,
    cancel_url: `${APP_URL}/settings?tab=billing`,
    subscription_data: { metadata: { userId: user.id } },
    allow_promotion_codes: true,
    ...(discounts ? { discounts } : {}),
  });

  return NextResponse.json({ url: checkoutSession.url });
}
