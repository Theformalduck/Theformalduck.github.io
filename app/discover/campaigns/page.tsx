export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { CampaignsExplore } from "./explore-client";

export const metadata: Metadata = {
  title: "Explore Campaigns",
  description: "Discover and back crowdfunding campaigns from creators on Sellora.",
};

export default async function ExploreCampaignsPage() {
  const rows = await db.campaign.findMany({
    where: {
      status: "ACTIVE",
      user: { username: { not: null }, bannedAt: null },
    },
    select: {
      id: true,
      title: true,
      shortDesc: true,
      coverImage: true,
      goal: true,
      raised: true,
      category: true,
      deadline: true,
      createdAt: true,
      user: { select: { username: true, name: true, image: true, verified: true } },
      _count: { select: { backers: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 120,
  });

  const campaigns = rows.map((c) => ({
    id: c.id,
    title: c.title,
    shortDesc: c.shortDesc,
    coverImage: c.coverImage,
    goal: c.goal,
    raised: c.raised,
    category: c.category,
    deadline: c.deadline ? c.deadline.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    backers: c._count.backers,
    creator: c.user,
  }));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <CampaignsExplore campaigns={campaigns} />
      <Footer />
    </div>
  );
}
