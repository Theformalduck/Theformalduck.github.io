import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/canvas-templates/[id] — fetch full template (with canvasData)
export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  const template = await db.communityTemplate.findUnique({
    where: { id },
    include: { author: { select: { username: true, name: true, image: true, verified: true } } },
  });

  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Increment useCount when someone fetches the full data (they're about to use it)
  await db.communityTemplate.update({ where: { id }, data: { useCount: { increment: 1 } } });

  return NextResponse.json(template);
}

// DELETE /api/canvas-templates/[id] — remove own template
export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const template = await db.communityTemplate.findUnique({ where: { id }, select: { authorId: true } });
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = (session.user as any).role === "ADMIN";
  if (template.authorId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.communityTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
