import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail, passwordResetEmail, appUrl } from "@/lib/email";
import crypto from "crypto";
import { rateLimit, getIP } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  const rl = await rateLimit(`forgot-pw:${ip}`, 5, 60 * 60 * 1000); // 5 per hour per IP
  if (!rl.allowed) {
    return NextResponse.json({ ok: true }); // silent rate limit to prevent enumeration
  }

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  // Always return success to prevent user enumeration
  const user = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ ok: true });

  // Delete any existing tokens for this user
  await db.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.passwordResetToken.create({ data: { userId: user.id, token, expiresAt } });

  const resetUrl = `${appUrl}/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Reset your Sellora password",
    html: passwordResetEmail(resetUrl),
  });

  return NextResponse.json({ ok: true });
}
