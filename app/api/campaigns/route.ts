import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizeField, sanitizeUrl, sanitizeArray } from "@/lib/sanitize";
import { normalizeFaq, normalizeStretchGoals } from "@/lib/campaign-extras";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const campaigns = await db.campaign.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { backers: true } },
      rewards: { select: { id: true, title: true, amount: true, limit: true, claimed: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(campaigns);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const title       = sanitizeField(body.title, 200);
    const shortDesc   = sanitizeField(body.shortDesc, 300) || null;
    const description = sanitizeField(body.description, 50000);
    const coverImage  = sanitizeUrl(body.coverImage);
    const images      = sanitizeArray(body.images, true, 2000).slice(0, 12);
    const { goal, deadline, category, status, rewards } = body;

    if (!title || !description || !goal) {
      return NextResponse.json({ error: "title, description, and goal are required" }, { status: 400 });
    }

    const campaign = await db.campaign.create({
      data: {
        userId: session.user.id,
        title,
        shortDesc,
        description,
        goal: Number(goal),
        deadline: deadline ? new Date(deadline) : null,
        category: category ?? null,
        coverImage: coverImage ?? null,
        images,
        status: status === "ACTIVE" ? "ACTIVE" : "DRAFT",
        faq: normalizeFaq(body.faq) as unknown as Prisma.InputJsonValue,
        stretchGoals: normalizeStretchGoals(body.stretchGoals) as unknown as Prisma.InputJsonValue,
        rewards: rewards?.length
          ? {
              create: rewards.map((r: any) => ({
                title: sanitizeField(r.title, 200),
                description: sanitizeField(r.perks ?? r.description, 1000) ?? "",
                amount: Number(r.amount),
                limit: r.limit ? Number(r.limit) : null,
              })),
            }
          : undefined,
      },
      include: { rewards: true, _count: { select: { backers: true } } },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (err) {
    console.error("[campaigns POST]", err);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
