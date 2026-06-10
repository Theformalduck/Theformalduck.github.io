import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Join a group. Public groups grant membership instantly; private groups create
// a PENDING request the owner must approve.
export async function POST(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to join" }, { status: 401 });
  const userId = session.user.id;
  const { id } = await props.params;

  const group = await db.group.findUnique({ where: { id }, select: { visibility: true } });
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const existing = await db.groupMember.findUnique({ where: { groupId_userId: { groupId: id, userId } } });
  if (existing) return NextResponse.json({ status: existing.status });

  const status = group.visibility === "PUBLIC" ? "ACTIVE" : "PENDING";
  await db.groupMember.create({ data: { groupId: id, userId, status } });
  return NextResponse.json({ status });
}

// Leave a group (owners can't leave their own group).
export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const { id } = await props.params;

  const member = await db.groupMember.findUnique({ where: { groupId_userId: { groupId: id, userId } } });
  if (member?.role === "OWNER") {
    return NextResponse.json({ error: "Owners can't leave their own group." }, { status: 400 });
  }
  await db.groupMember.deleteMany({ where: { groupId: id, userId } });
  return NextResponse.json({ ok: true });
}
