import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();
  if (!token || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

  const record = await db.passwordResetToken.findUnique({ where: { token } });
  if (!record) return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
  if (record.expiresAt < new Date()) {
    await db.passwordResetToken.delete({ where: { token } });
    return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.user.update({ where: { id: record.userId }, data: { passwordHash } });
  await db.passwordResetToken.delete({ where: { token } });

  return NextResponse.json({ ok: true });
}
