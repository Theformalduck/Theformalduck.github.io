import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, subscriptionStatus: true, currentPeriodEnd: true },
  });

  return NextResponse.json({
    plan: user?.plan ?? "free",
    status: user?.subscriptionStatus ?? null,
    currentPeriodEnd: user?.currentPeriodEnd ?? null,
    isPro: user?.plan === "pro" && (user?.subscriptionStatus === "active" || user?.subscriptionStatus === "trialing"),
  });
}
