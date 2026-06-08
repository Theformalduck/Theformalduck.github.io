import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizeCode, checkDiscount } from "@/lib/discounts";

// Public: validate a promo code against a cart subtotal for a given store.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = normalizeCode(body.code ?? "");
    const creatorUsername = String(body.creatorUsername ?? "");
    const subtotalCents = Math.round(Number(body.subtotal ?? 0) * 100);

    if (!code || !creatorUsername) {
      return NextResponse.json({ valid: false, error: "Enter a code" }, { status: 200 });
    }

    const creator = await db.user.findUnique({ where: { username: creatorUsername }, select: { id: true } });
    if (!creator) return NextResponse.json({ valid: false, error: "Invalid code" }, { status: 200 });

    const discount = await db.discount.findFirst({ where: { userId: creator.id, code } });
    const check = checkDiscount(discount, subtotalCents);

    if (!check.ok) return NextResponse.json({ valid: false, error: check.reason }, { status: 200 });

    return NextResponse.json({
      valid: true,
      code,
      type: discount!.type,
      value: discount!.value,
      discountAmount: check.amountCents / 100,
    });
  } catch {
    return NextResponse.json({ valid: false, error: "Could not validate code" }, { status: 200 });
  }
}
