import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await props.params;

  const sub = await db.subscriber.findUnique({ where: { id }, select: { ownerId: true } });
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (sub.ownerId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.subscriber.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
