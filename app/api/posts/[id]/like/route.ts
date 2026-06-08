import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await props.params;
  const userId = session.user.id;

  const post = await db.post.findUnique({ where: { id }, select: { likes: true } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const existing = await db.postLike.findUnique({
    where: { userId_postId: { userId, postId: id } },
  });

  if (existing) {
    await db.postLike.delete({ where: { userId_postId: { userId, postId: id } } });
    const updated = await db.post.update({
      where: { id },
      data: { likes: { decrement: 1 } },
      select: { likes: true },
    });
    return NextResponse.json({ liked: false, likes: Math.max(0, updated.likes) });
  }

  await db.postLike.create({ data: { userId, postId: id } });
  const updated = await db.post.update({
    where: { id },
    data: { likes: { increment: 1 } },
    select: { likes: true },
  });
  return NextResponse.json({ liked: true, likes: updated.likes });
}
