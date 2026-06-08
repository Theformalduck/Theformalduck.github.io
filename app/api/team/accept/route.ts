import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Accept a team invite. The signed-in user's email must match the invited email.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Please sign in to accept the invite." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const token = String(body?.token ?? "");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const member = await db.teamMember.findUnique({ where: { token }, include: { owner: { select: { name: true, username: true } } } });
  if (!member) return NextResponse.json({ error: "This invite is no longer valid." }, { status: 404 });

  if (session.user.email?.toLowerCase() !== member.email.toLowerCase()) {
    return NextResponse.json({ error: `This invite was sent to ${member.email}. Sign in with that account to accept.` }, { status: 403 });
  }

  await db.teamMember.update({
    where: { id: member.id },
    data: { userId: session.user.id, status: "active", acceptedAt: new Date(), token: null },
  });

  return NextResponse.json({ ok: true, account: { ownerId: member.ownerId, name: member.owner?.name ?? member.owner?.username ?? "Account" } });
}
