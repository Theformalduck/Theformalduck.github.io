import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin";

// List reports for the moderation queue (admin only).
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAdmin(session.user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const status = new URL(req.url).searchParams.get("status") ?? "open";
  const reports = await db.report.findMany({
    where: status === "all" ? {} : { status },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { reporter: { select: { name: true, username: true, email: true } } },
  });
  const openCount = await db.report.count({ where: { status: "open" } });
  return NextResponse.json({ reports, openCount });
}

// Resolve a report: dismiss or mark actioned (admin only).
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAdmin(session.user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const id = String(body?.id ?? "");
  const status = String(body?.status ?? "");
  if (!id || !["dismissed", "actioned", "open"].includes(status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  await db.report.update({ where: { id }, data: { status, reviewedAt: status === "open" ? null : new Date() } });
  return NextResponse.json({ ok: true });
}
