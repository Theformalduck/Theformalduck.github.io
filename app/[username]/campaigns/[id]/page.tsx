export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import CampaignPublicClient from "./campaign-public-client";

export default async function PublicCampaignPage(
  props: PageProps<"/[username]/campaigns/[id]">
) {
  const { username, id } = await props.params;

  const user = await db.user.findUnique({
    where: { username },
    select: { id: true, name: true, username: true, image: true, bio: true, stripeAccountId: true },
  });
  if (!user) notFound();

  const campaign = await db.campaign.findUnique({
    where: { id, userId: user.id, status: "ACTIVE" },
    include: {
      rewards: { orderBy: { amount: "asc" } },
      updates: { orderBy: { createdAt: "desc" }, take: 10 },
      _count: { select: { backers: true } },
    },
  });
  if (!campaign) notFound();

  const session = await auth();

  const serialized = {
    ...campaign,
    deadline: campaign.deadline ? campaign.deadline.toISOString() : null,
    updates: campaign.updates.map(u => ({ ...u, createdAt: u.createdAt.toISOString() })),
  };

  return (
    <CampaignPublicClient
      campaign={serialized}
      creator={user}
      sellerHasPayments={!!user.stripeAccountId}
      currentUserId={session?.user?.id ?? null}
    />
  );
}
