import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.resume.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    select: { id: true, label: true, data: true, isDefault: true, updatedAt: true, createdAt: true },
  });

  return NextResponse.json({
    resumes: rows.map(r => ({
      id: r.id,
      label: r.label ?? "My Resume",
      data: JSON.parse(r.data),
      isDefault: r.isDefault,
      updatedAt: r.updatedAt,
    })),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Pro gate: free users may only have one resume
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, subscriptionStatus: true },
  });
  const isPro = user?.plan === "pro" && (user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing");

  const existingCount = await prisma.resume.count({ where: { userId: session.user.id } });
  if (!isPro && existingCount >= 1) {
    return NextResponse.json({ error: "Pro required", proRequired: true }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const label: string = body.label ?? "My Resume";
  const data = body.data ?? null;

  // First resume is auto-default
  const row = await prisma.resume.create({
    data: {
      userId: session.user.id,
      label,
      data: JSON.stringify(data),
      isDefault: existingCount === 0,
    },
  });

  return NextResponse.json({ id: row.id, label: row.label ?? label });
}
