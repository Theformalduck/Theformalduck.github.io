import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripeEnabled, createCheckoutSession } from "@/lib/stripe";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  if (!stripeEnabled) return NextResponse.json({ error: "Payments not configured" }, { status: 503 });

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Please sign in to back this campaign." }, { status: 401 });

  const { id: campaignId } = await props.params;
  const { rewardId, customAmount } = await req.json();

  const campaign = await db.campaign.findUnique({
    where: { id: campaignId, status: "ACTIVE" },
    include: { rewards: true, user: { select: { stripeAccountId: true, username: true } } },
  });

  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  if (!campaign.user.stripeAccountId) return NextResponse.json({ error: "Creator has not set up payments" }, { status: 400 });

  const reward = rewardId ? campaign.rewards.find((r) => r.id === rewardId) : null;
  const amount = reward ? reward.amount : Number(customAmount);

  if (!amount || amount < 1) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  if (reward?.limit && reward.limit <= reward.claimed) {
    return NextResponse.json({ error: "This reward tier is sold out" }, { status: 400 });
  }

  const origin = req.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "";
  const label = reward ? `${campaign.title} — ${reward.title}` : campaign.title;

  try {
    const checkout = await createCheckoutSession({
      sellerAccountId: campaign.user.stripeAccountId,
      currency: "USD",
      items: [{ name: label, quantity: 1, unitPrice: amount }],
      total: amount,
      customId: campaignId,
      description: `Pledge to ${campaign.title}`.slice(0, 250),
      successUrl: `${origin}/${campaign.user.username}/campaigns/${campaignId}?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/${campaign.user.username}/campaigns/${campaignId}?stripe=cancelled`,
      brandName: campaign.title,
      buyerEmail: session.user.email ?? null,
    });

    await db.pendingCheckout.create({
      data: {
        id: checkout.id,
        kind: "campaign",
        data: { campaignId, rewardId: rewardId || null, amount, buyerId: session.user.id },
      },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err: any) {
    console.error("[campaigns/back]", err);
    return NextResponse.json({ error: err?.message ?? "Failed to start checkout" }, { status: 500 });
  }
}
