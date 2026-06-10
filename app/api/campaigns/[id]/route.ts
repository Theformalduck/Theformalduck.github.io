import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizeField, sanitizeUrl, sanitizeArray } from "@/lib/sanitize";
import { normalizeFaq, normalizeStretchGoals } from "@/lib/campaign-extras";

async function ownsCampaign(userId: string, campaignId: string) {
  const c = await db.campaign.findUnique({ where: { id: campaignId }, select: { userId: true } });
  return c?.userId === userId;
}

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await props.params;

  const campaign = await db.campaign.findUnique({
    where: { id },
    include: { rewards: true, _count: { select: { backers: true } } },
  });

  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (campaign.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(campaign);
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await props.params;
  if (!(await ownsCampaign(session.user.id, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { goal, deadline, category, status } = body;
    const title       = body.title !== undefined ? sanitizeField(body.title, 200) : undefined;
    const shortDesc   = body.shortDesc !== undefined ? (sanitizeField(body.shortDesc, 300) || null) : undefined;
    const description = body.description !== undefined ? sanitizeField(body.description, 50000) : undefined;
    const coverImage  = body.coverImage !== undefined ? sanitizeUrl(body.coverImage) : undefined;
    const images      = body.images !== undefined ? sanitizeArray(body.images, true, 2000).slice(0, 12) : undefined;

    const campaign = await db.campaign.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(shortDesc !== undefined && { shortDesc }),
        ...(description !== undefined && { description }),
        ...(goal !== undefined && { goal: Number(goal) }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(category !== undefined && { category }),
        ...(coverImage !== undefined && { coverImage: coverImage ?? null }),
        ...(images !== undefined && { images }),
        ...(status !== undefined && { status }),
        ...(body.faq !== undefined && { faq: normalizeFaq(body.faq) as unknown as Prisma.InputJsonValue }),
        ...(body.stretchGoals !== undefined && { stretchGoals: normalizeStretchGoals(body.stretchGoals) as unknown as Prisma.InputJsonValue }),
      },
      include: { rewards: true, _count: { select: { backers: true } } },
    });

    return NextResponse.json(campaign);
  } catch (err) {
    console.error("[campaigns/[id] PUT]", err);
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await props.params;
  if (!(await ownsCampaign(session.user.id, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.campaign.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
