import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, content = {}, visible = true } = body;

    const portfolio = await db.portfolio.findUnique({
      where: { userId: session.user.id },
      include: { sections: { orderBy: { order: "desc" }, take: 1 } },
    });

    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    }

    const maxOrder = portfolio.sections[0]?.order ?? -1;

    const section = await db.portfolioSection.create({
      data: {
        portfolioId: portfolio.id,
        type,
        content,
        visible,
        order: maxOrder + 1,
      },
    });

    return NextResponse.json(section, { status: 201 });
  } catch (err) {
    console.error("[sections POST]", err);
    return NextResponse.json({ error: "Failed to create section" }, { status: 500 });
  }
}
