import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const templates = await db.communityTemplate.findMany({
    where: category ? { category } : undefined,
    orderBy: { useCount: "desc" },
    take: limit,
    skip: offset,
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      thumbnail: true,
      useCount: true,
      createdAt: true,
      canvasData: true,
      author: { select: { username: true, name: true, image: true, verified: true } },
    },
  });

  const total = await db.communityTemplate.count({ where: category ? { category } : undefined });

  // Send only first page for preview to keep payload small
  const withPreview = templates.map(({ canvasData, ...t }) => ({
    ...t,
    previewDoc: canvasData ? { version: 1, pages: [(canvasData as any).pages?.[0]].filter(Boolean) } : null,
  }));

  return NextResponse.json({ templates: withPreview, total });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, description, category, canvasData, thumbnail } = await req.json();

    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!canvasData?.version) return NextResponse.json({ error: "Invalid canvas data" }, { status: 400 });

    const template = await db.communityTemplate.create({
      data: {
        authorId: session.user.id,
        name: name.trim(),
        description: description?.trim() ?? null,
        category: category?.trim() ?? null,
        thumbnail: thumbnail ?? null,
        canvasData,
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        useCount: true,
        createdAt: true,
        author: { select: { username: true, name: true, image: true } },
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (err) {
    console.error("[canvas-templates POST]", err);
    return NextResponse.json({ error: "Failed to publish template" }, { status: 500 });
  }
}
