import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return user?.role === "ADMIN" ? session : null;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsers,
    totalOrders,
    newOrders,
    totalRevenue,
    activeCampaigns,
    totalCampaigns,
    bannedUsers,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.order.count(),
    db.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.order.aggregate({ _sum: { total: true } }),
    db.campaign.count({ where: { status: "ACTIVE" } }),
    db.campaign.count(),
    db.user.count({ where: { bannedAt: { not: null } } }),
  ]);

  return NextResponse.json({
    totalUsers,
    newUsers,
    totalOrders,
    newOrders,
    totalRevenue: totalRevenue._sum.total ?? 0,
    activeCampaigns,
    totalCampaigns,
    bannedUsers,
  });
}
