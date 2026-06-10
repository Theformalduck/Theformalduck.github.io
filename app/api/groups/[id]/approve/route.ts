import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Owner approves (or declines) a pending join request for a private group.
export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await props.params;

  const group = await db.group.findUnique({ where: { id }, select: { ownerId: true } });
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });
  if (group.ownerId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId: memberUserId, action } = (await req.json().catch(() => ({}))) as { userId?: string; action?: string };
  if (!memberUserId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  if (action === "decline") {
    await db.groupMember.deleteMany({ where: { groupId: id, userId: memberUserId, status: "PENDING" } });
  } else {
    await db.groupMember.updateMany({ where: { groupId: id, userId: memberUserId, status: "PENDING" }, data: { status: "ACTIVE" } });
  }
  return NextResponse.json({ ok: true });
}
