import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await props.params;

  const post = await db.post.findUnique({ where: { id }, select: { userId: true } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  if (post.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.post.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
