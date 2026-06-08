import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST { ids: string[] } — ordered array of section IDs
// Updates each section's order = its index in the array.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ids } = await req.json() as { ids: string[] };

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids must be a non-empty array" }, { status: 400 });
    }

    // Verify all IDs belong to this user's portfolio
    const portfolio = await db.portfolio.findUnique({
      where: { userId: session.user.id },
      select: { sections: { select: { id: true } } },
    });

    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    }

    const ownedIds = new Set(portfolio.sections.map(s => s.id));
    if (!ids.every(id => ownedIds.has(id))) {
      return NextResponse.json({ error: "Invalid section IDs" }, { status: 403 });
    }

    await Promise.all(
      ids.map((id, order) =>
        db.portfolioSection.update({ where: { id }, data: { order } })
      )
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[sections/reorder POST]", err);
    return NextResponse.json({ error: "Reorder failed" }, { status: 500 });
  }
}
