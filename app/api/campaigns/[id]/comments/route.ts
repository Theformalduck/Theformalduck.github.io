import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizeField } from "@/lib/sanitize";

// Public: list comments for a campaign (newest first).
export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const comments = await db.campaignComment.findMany({
    where: { campaignId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      body: true,
      createdAt: true,
      userId: true,
      user: { select: { name: true, username: true, image: true } },
    },
  });
  return NextResponse.json(comments);
}

// Auth: post a comment on a campaign.
export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to comment" }, { status: 401 });

  const { id } = await props.params;
  const campaign = await db.campaign.findUnique({ where: { id }, select: { id: true } });
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const raw = (await req.json().catch(() => ({}))) as { body?: string };
  const body = sanitizeField(raw.body, 2000);
  if (!body) return NextResponse.json({ error: "Comment can't be empty" }, { status: 400 });

  const comment = await db.campaignComment.create({
    data: { campaignId: id, userId: session.user.id, body },
    select: {
      id: true,
      body: true,
      createdAt: true,
      userId: true,
      user: { select: { name: true, username: true, image: true } },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
