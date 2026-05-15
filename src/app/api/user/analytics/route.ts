import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const SOURCE_COLORS: Record<string, string> = {
  LinkedIn:    "#0A66C2",
  Google:      "#34A853",
  GitHub:      "#6e7681",
  "Twitter / X": "#1DA1F2",
  Instagram:   "#E1306C",
  Facebook:    "#1877F2",
  Reddit:      "#FF4500",
  Direct:      "rgba(255,255,255,0.5)",
  Other:       "rgba(255,255,255,0.25)",
};

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "30", 10);

  const portfolio = await prisma.portfolio.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!portfolio) return NextResponse.json({ total: 0, dailyViews: [], sources: [], recentViews: [] });

  const since = days > 0 ? new Date(Date.now() - days * 864e5) : new Date(0);

  const views = await prisma.portfolioView.findMany({
    where: { portfolioId: portfolio.id, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
  });

  // Daily counts
  const dayCounts: Record<string, number> = {};
  if (days > 0) {
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5);
      dayCounts[d.toISOString().slice(0, 10)] = 0;
    }
  }
  for (const v of views) {
    const key = v.createdAt.toISOString().slice(0, 10);
    dayCounts[key] = (dayCounts[key] ?? 0) + 1;
  }
  const dailyViews = Object.entries(dayCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  // Source breakdown (use utmSource which we pre-classify at write time)
  const sourceCounts: Record<string, number> = {};
  for (const v of views) {
    const s = v.utmSource || "Direct";
    sourceCounts[s] = (sourceCounts[s] ?? 0) + 1;
  }
  const total = views.length;
  const sources = Object.entries(sourceCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([source, count]) => ({
      source,
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
      color: SOURCE_COLORS[source] ?? SOURCE_COLORS.Other,
    }));

  // Recent 50 visits
  const recentViews = views.slice(0, 50).map(v => ({
    id: v.id,
    source: v.utmSource || "Direct",
    referrer: v.referrer,
    createdAt: v.createdAt,
    color: SOURCE_COLORS[v.utmSource || "Direct"] ?? SOURCE_COLORS.Other,
  }));

  // Avg views per day
  const activeDays = Object.values(dayCounts).filter(n => n > 0).length;
  const avgPerDay = activeDays > 0 ? Math.round(total / activeDays) : 0;

  return NextResponse.json({ total, dailyViews, sources, recentViews, avgPerDay });
}
