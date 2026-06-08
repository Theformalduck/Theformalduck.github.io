import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail, verifyEmailTemplate, appUrl } from "@/lib/email";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, emailVerified: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.emailVerified) return NextResponse.json({ ok: true, alreadyVerified: true });

  // Delete existing tokens and create a fresh one
  await db.emailVerificationToken.deleteMany({ where: { userId: user.id } });
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await db.emailVerificationToken.create({ data: { userId: user.id, token, expiresAt } });

  const verifyUrl = `${appUrl}/api/auth/verify-email?token=${token}`;
  try {
    await sendEmail({
      to: user.email,
      subject: "Verify your Sellora email",
      html: verifyEmailTemplate(verifyUrl),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
