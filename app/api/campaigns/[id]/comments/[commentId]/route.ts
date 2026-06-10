import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Delete a comment — allowed for its author or the campaign owner (moderation).
export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string; commentId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, commentId } = await props.params;

  const comment = await db.campaignComment.findUnique({
    where: { id: commentId },
    select: { userId: true, campaignId: true, campaign: { select: { userId: true } } },
  });
  if (!comment || comment.campaignId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isAuthor = comment.userId === session.user.id;
  const isOwner = comment.campaign.userId === session.user.id;
  if (!isAuthor && !isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.campaignComment.delete({ where: { id: commentId } });
  return NextResponse.json({ ok: true });
}
