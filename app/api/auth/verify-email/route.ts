import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(`${appUrl}/login?error=invalid-token`);
  }

  const record = await db.emailVerificationToken.findUnique({ where: { token } });

  if (!record || record.expiresAt < new Date()) {
    await db.emailVerificationToken.deleteMany({ where: { token } });
    return NextResponse.redirect(`${appUrl}/login?error=expired-token`);
  }

  await db.user.update({
    where: { id: record.userId },
    data: { emailVerified: new Date() },
  });

  await db.emailVerificationToken.delete({ where: { id: record.id } });

  return NextResponse.redirect(`${appUrl}/dashboard?verified=1`);
}
