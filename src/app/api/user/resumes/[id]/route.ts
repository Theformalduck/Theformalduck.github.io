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

  return NextResponse.json({ id: row.id, label: row.label ?? "My Resume", data: JSON.parse(row.data) });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const row = await getOwnedResume(session.user.id, id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
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
  return NextResponse.json({ ok: true });
}
