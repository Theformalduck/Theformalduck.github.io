import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeCode } from "@/lib/discounts";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const discounts = await db.discount.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(discounts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const code = normalizeCode(body.code ?? "");
    if (!code) return NextResponse.json({ error: "Code is required" }, { status: 400 });
    if (!/^[A-Z0-9]+$/.test(code)) return NextResponse.json({ error: "Code must be letters and numbers only" }, { status: 400 });

    const type = body.type === "FIXED" ? "FIXED" : "PERCENT";
    const value = Number(body.value);
    if (!Number.isFinite(value) || value <= 0) return NextResponse.json({ error: "Enter a valid amount" }, { status: 400 });
    if (type === "PERCENT" && value > 100) return NextResponse.json({ error: "Percentage cannot exceed 100" }, { status: 400 });

    const existing = await db.discount.findFirst({ where: { userId: session.user.id, code }, select: { id: true } });
    if (existing) return NextResponse.json({ error: "You already have a code with that name" }, { status: 409 });

    const discount = await db.discount.create({
      data: {
        userId: session.user.id,
        code,
        type,
        value,
        active: body.active !== false,
        minSubtotal: Number.isFinite(Number(body.minSubtotal)) ? Math.max(0, Number(body.minSubtotal)) : 0,
        usageLimit: body.usageLimit != null && Number(body.usageLimit) > 0 ? Math.floor(Number(body.usageLimit)) : null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    });
    return NextResponse.json(discount, { status: 201 });
  } catch (err) {
    console.error("[discounts POST]", err);
    return NextResponse.json({ error: "Failed to create discount" }, { status: 500 });
  }
}
