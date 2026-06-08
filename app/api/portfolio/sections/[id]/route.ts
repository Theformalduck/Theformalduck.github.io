import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { visible, content, order } = body;

    const section = await db.portfolioSection.findFirst({
      where: { id, portfolio: { userId: session.user.id } },
    });

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    const updated = await db.portfolioSection.update({
      where: { id },
      data: {
        ...(visible !== undefined && { visible }),
        ...(content !== undefined && { content }),
        ...(order !== undefined && { order }),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[sections/:id PUT]", err);
    return NextResponse.json({ error: "Failed to update section" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const section = await db.portfolioSection.findFirst({
      where: { id, portfolio: { userId: session.user.id } },
    });

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    await db.portfolioSection.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[sections/:id DELETE]", err);
    return NextResponse.json({ error: "Failed to delete section" }, { status: 500 });
  }
}
