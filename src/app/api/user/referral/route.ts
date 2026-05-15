import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function generateCode(userId: string): string {
  // Short alphanumeric code derived from userId
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.abs(userId.charCodeAt(i % userId.length) + i * 7) % chars.length];
  }
  return code;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { referralCode: true, referralCount: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Auto-generate code on first access
  if (!user.referralCode) {
    const code = generateCode(session.user.id);
    try {
      user = await prisma.user.update({
        where: { id: session.user.id },
        data: { referralCode: code },
        select: { referralCode: true, referralCount: true },
      });
    } catch {
      // In case of unique constraint collision, try a random suffix
      const fallback = code + Math.random().toString(36).slice(2, 4).toUpperCase();
      user = await prisma.user.update({
        where: { id: session.user.id },
        data: { referralCode: fallback },
        select: { referralCode: true, referralCount: true },
      });
    }
  }

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://folio.ai";
  return NextResponse.json({
    code: user.referralCode,
    count: user.referralCount,
    link: `${APP_URL}/sign-up?ref=${user.referralCode}`,
  });
}
