import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.resume.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, label: true, data: true, updatedAt: true, createdAt: true },
  });

  return NextResponse.json({
    resumes: rows.map(r => ({
      id: r.id,
      label: r.label ?? "My Resume",
      data: JSON.parse(r.data),
      updatedAt: r.updatedAt,
    })),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const label: string = body.label ?? "My Resume";
  const data = body.data ?? null;

  const row = await prisma.resume.create({
    data: {
      userId: session.user.id,
      label,
      data: JSON.stringify(data),
    },
  });

  return NextResponse.json({ id: row.id, label: row.label ?? label });
}
