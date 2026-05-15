import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function getOwnedResume(userId: string, id: string) {
  return prisma.resume.findFirst({ where: { id, userId } });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const row = await getOwnedResume(session.user.id, id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ id: row.id, label: row.label ?? "My Resume", data: JSON.parse(row.data), isDefault: row.isDefault });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const row = await getOwnedResume(session.user.id, id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  if (body.isDefault === true) {
    // Clear default from all user's resumes, then set this one
    await prisma.$transaction([
      prisma.resume.updateMany({ where: { userId: session.user.id }, data: { isDefault: false } }),
      prisma.resume.update({ where: { id }, data: { isDefault: true } }),
    ]);
    return NextResponse.json({ ok: true });
  }

  await prisma.resume.update({
    where: { id },
    data: {
      ...(body.label !== undefined && { label: body.label }),
      ...(body.data !== undefined && { data: JSON.stringify(body.data) }),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const row = await getOwnedResume(session.user.id, id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.resume.delete({ where: { id } });

  // If deleted resume was the default, promote the most-recently-updated remaining one
  if (row.isDefault) {
    const next = await prisma.resume.findFirst({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    });
    if (next) await prisma.resume.update({ where: { id: next.id }, data: { isDefault: true } });
  }

  return NextResponse.json({ ok: true });
}
