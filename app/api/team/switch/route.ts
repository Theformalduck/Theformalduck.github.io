import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ACCOUNT_COOKIE } from "@/lib/team";

// Switch the active account (own account or one the user staffs). Sets an
// httpOnly cookie that getActiveAccount() reads.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const ownerId = String(body?.ownerId ?? "");
  if (!ownerId) return NextResponse.json({ error: "Missing ownerId" }, { status: 400 });

  // Allowed if it's their own account or an active membership.
  let allowed = ownerId === session.user.id;
  if (!allowed) {
    const member = await db.teamMember.findFirst({ where: { ownerId, userId: session.user.id, status: "active" } });
    allowed = !!member;
  }
  if (!allowed) return NextResponse.json({ error: "You don't have access to that account." }, { status: 403 });

  const res = NextResponse.json({ ok: true, activeId: ownerId });
  res.cookies.set(ACCOUNT_COOKIE, ownerId, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return res;
}
