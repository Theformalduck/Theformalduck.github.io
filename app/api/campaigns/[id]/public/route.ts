import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  const campaign = await db.campaign.findUnique({
    where: { id, status: "ACTIVE" },
    include: {
      rewards: { orderBy: { amount: "asc" } },
      updates: { orderBy: { createdAt: "desc" }, take: 5 },
      _count: { select: { backers: true } },
      user: { select: { id: true, name: true, username: true, image: true, bio: true, stripeAccountId: true } },
    },
  });

  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  return NextResponse.json({
    ...campaign,
    sellerHasStripe: !!campaign.user.stripeAccountId,
    user: { ...campaign.user, stripeAccountId: undefined },
  });
}
