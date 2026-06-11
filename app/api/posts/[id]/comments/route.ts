import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizeField } from "@/lib/sanitize";
import { moderateText } from "@/lib/moderation";
import { notify } from "@/lib/notify";

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await props.params;

  const post = await db.post.findUnique({ where: { id }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const comments = await db.comment.findMany({
    where: { postId: id },
    include: {
      user: { select: { id: true, name: true, username: true, image: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await props.params;
  const content = sanitizeField((await req.json()).content, 2000);

  if (!content) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const mod = moderateText(content);
  if (!mod.ok) return NextResponse.json({ error: mod.reason }, { status: 422 });

  const post = await db.post.findUnique({ where: { id }, select: { id: true, userId: true } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const comment = await db.comment.create({
    data: { postId: id, userId: session.user.id, content },
    include: {
      user: { select: { id: true, name: true, username: true, image: true } },
    },
  });

  // Notify post author (not when commenting on your own post)
  if (post.userId !== session.user.id) {
    await notify({
      userId: post.userId,
      type: "POST_COMMENT",
      title: "New comment on your post",
      body: content.length > 80 ? content.slice(0, 80) + "…" : content,
      data: { postId: id, commentId: comment.id },
      link: "/community",
    });
  }

  return NextResponse.json(comment, { status: 201 });
}
