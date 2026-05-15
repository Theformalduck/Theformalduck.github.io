import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cookieStore = await cookies();
  const refCode = cookieStore.get("folio_ref")?.value;
  if (!refCode) return NextResponse.json({ ok: false, reason: "no_ref" });

  // Check if already has a referrer
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { referredBy: true },
  });
  if (!user || user.referredBy) {
    return NextResponse.json({ ok: false, reason: "already_applied" });
  }

  // Find the referrer
  const referrer = await prisma.user.findUnique({
    where: { referralCode: refCode },
    select: { id: true },
  });
  if (!referrer || referrer.id === session.user.id) {
    return NextResponse.json({ ok: false, reason: "invalid_code" });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { referredBy: referrer.id },
  });

  return NextResponse.json({ ok: true });
}
