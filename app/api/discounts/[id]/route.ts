import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeCode } from "@/lib/discounts";

async function owns(userId: string, id: string) {
  const d = await db.discount.findUnique({ where: { id }, select: { userId: true } });
  return d?.userId === userId;
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await props.params;
  if (!(await owns(session.user.id, id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (body.code !== undefined) {
      const code = normalizeCode(body.code);
      if (!code || !/^[A-Z0-9]+$/.test(code)) return NextResponse.json({ error: "Invalid code" }, { status: 400 });
      const clash = await db.discount.findFirst({ where: { userId: session.user.id, code, NOT: { id } }, select: { id: true } });
      if (clash) return NextResponse.json({ error: "You already have a code with that name" }, { status: 409 });
      data.code = code;
    }
    if (body.type !== undefined) data.type = body.type === "FIXED" ? "FIXED" : "PERCENT";
    if (body.value !== undefined) {
      const value = Number(body.value);
      if (!Number.isFinite(value) || value <= 0) return NextResponse.json({ error: "Enter a valid amount" }, { status: 400 });
      data.value = value;
    }
    if (body.active !== undefined) data.active = !!body.active;
    if (body.minSubtotal !== undefined) data.minSubtotal = Math.max(0, Number(body.minSubtotal) || 0);
    if (body.usageLimit !== undefined) data.usageLimit = body.usageLimit != null && Number(body.usageLimit) > 0 ? Math.floor(Number(body.usageLimit)) : null;
    if (body.expiresAt !== undefined) data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

    const discount = await db.discount.update({ where: { id }, data });
    return NextResponse.json(discount);
  } catch (err) {
    console.error("[discounts/[id] PUT]", err);
    return NextResponse.json({ error: "Failed to update discount" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await props.params;
  if (!(await owns(session.user.id, id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.discount.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
