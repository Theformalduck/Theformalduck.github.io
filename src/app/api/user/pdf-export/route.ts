import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const FREE_LIMIT = 1;

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, subscriptionStatus: true, pdfExportCount: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const isPro = user.plan === "pro" && (user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing");

  if (!isPro && user.pdfExportCount >= FREE_LIMIT) {
    return NextResponse.json({ error: "Export limit reached", limitReached: true, used: user.pdfExportCount, limit: FREE_LIMIT }, { status: 429 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { pdfExportCount: { increment: 1 } },
  });

  return NextResponse.json({ ok: true, used: user.pdfExportCount + 1, limit: isPro ? null : FREE_LIMIT });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, subscriptionStatus: true, pdfExportCount: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const isPro = user.plan === "pro" && (user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing");

  return NextResponse.json({
    used: user.pdfExportCount,
    limit: FREE_LIMIT,
    isPro,
    canExport: isPro || user.pdfExportCount < FREE_LIMIT,
  });
}
