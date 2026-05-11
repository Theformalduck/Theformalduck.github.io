import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const row = await prisma.resume.findFirst({ where: { userId: session.user.id }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ data: row ? JSON.parse(row.data) : null });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data } = await req.json();
  const existing = await prisma.resume.findFirst({ where: { userId: session.user.id }, orderBy: { updatedAt: "desc" } });
  if (existing) {
    await prisma.resume.update({ where: { id: existing.id }, data: { data: JSON.stringify(data) } });
  } else {
    await prisma.resume.create({ data: { userId: session.user.id, label: "My Resume", data: JSON.stringify(data) } });
  }
  return NextResponse.json({ ok: true });
}
