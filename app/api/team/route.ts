import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ASSIGNABLE_ROLES, type Role } from "@/lib/team";
import { sendEmailAfter, teamInviteEmail, appUrl } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// List the people who work for my account.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const members = await db.teamMember.findMany({
    where: { ownerId: session.user.id },
    orderBy: { invitedAt: "asc" },
    select: {
      id: true, email: true, role: true, status: true, invitedAt: true, acceptedAt: true,
      member: { select: { name: true, image: true, username: true } },
    },
  });
  return NextResponse.json({ members });
}

// Invite a teammate by email.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();
    const role = String(body?.role ?? "STAFF").toUpperCase() as Role;

    if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (!ASSIGNABLE_ROLES.includes(role)) return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    if (email === session.user.email?.toLowerCase()) return NextResponse.json({ error: "You can't invite yourself." }, { status: 400 });

    const token = crypto.randomBytes(24).toString("hex");
    const existingUser = await db.user.findUnique({ where: { email }, select: { id: true } });

    const member = await db.teamMember.upsert({
      where: { ownerId_email: { ownerId: session.user.id, email } },
      create: { ownerId: session.user.id, email, role, status: "pending", token, userId: existingUser?.id ?? null },
      update: { role, token, status: "pending" },
      select: { id: true, email: true, role: true, status: true, invitedAt: true, acceptedAt: true, member: { select: { name: true, image: true, username: true } } },
    });

    const inviter = await db.user.findUnique({ where: { id: session.user.id }, select: { name: true, username: true } });
    sendEmailAfter({
      to: email,
      subject: `You've been invited to join ${inviter?.name ?? inviter?.username ?? "a team"} on Sellora`,
      html: teamInviteEmail({
        inviterName: inviter?.name ?? inviter?.username ?? "A Sellora creator",
        accountName: inviter?.name ?? inviter?.username ?? "their store",
        role: role.charAt(0) + role.slice(1).toLowerCase(),
        acceptUrl: `${appUrl}/team/accept?token=${token}`,
      }),
    });

    return NextResponse.json({ member });
  } catch (err) {
    console.error("[team POST]", err);
    return NextResponse.json({ error: "Failed to send invite." }, { status: 500 });
  }
}

// Change a member's role.
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = String(body?.id ?? "");
  const role = String(body?.role ?? "").toUpperCase() as Role;
  if (!id || !ASSIGNABLE_ROLES.includes(role)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const member = await db.teamMember.findFirst({ where: { id, ownerId: session.user.id } });
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  await db.teamMember.update({ where: { id }, data: { role } });
  return NextResponse.json({ ok: true });
}

// Remove a member.
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const member = await db.teamMember.findFirst({ where: { id, ownerId: session.user.id } });
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  await db.teamMember.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
