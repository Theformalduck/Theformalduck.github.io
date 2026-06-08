import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(now.getDate() - 60);

  const [
    campaigns,
    followerCount,
    followerCountLastMonth,
    recentOrders,
    prevOrders,
    notifications,
    user,
  ] = await Promise.all([
    db.campaign.findMany({
      where: { userId },
      include: { _count: { select: { backers: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.follow.count({ where: { followingId: userId } }),
    db.follow.count({ where: { followingId: userId, createdAt: { lt: thirtyDaysAgo } } }),
    db.order.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        items: { some: { product: { userId } } },
      },
      include: {
        items: {
          where: { product: { userId } },
          include: { product: { select: { name: true } } },
        },
        buyer: { select: { id: true, name: true, username: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.order.findMany({
      where: {
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        items: { some: { product: { userId } } },
      },
      include: {
        items: {
          where: { product: { userId } },
          include: { product: { select: { name: true } } },
        },
      },
    }),
    db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, username: true, image: true },
    }),
  ]);

  const calcRevenue = (orders: Array<{ items: Array<{ price: number; quantity: number }> }>) =>
    orders.reduce((sum, o) => {
      const itemRevenue = o.items.reduce((s: number, i) => s + i.price * i.quantity, 0);
      return sum + itemRevenue;
    }, 0);

  const thisMonthRevenue = calcRevenue(recentOrders);
  const prevMonthRevenue = calcRevenue(prevOrders);
  const revenueChange = prevMonthRevenue > 0
    ? ((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
    : thisMonthRevenue > 0 ? 100 : 0;

  const followersGained = followerCount - followerCountLastMonth;
  const followersChange = followerCountLastMonth > 0
    ? (followersGained / followerCountLastMonth) * 100
    : followersGained > 0 ? 100 : 0;

  const ordersChange = prevOrders.length > 0
    ? ((recentOrders.length - prevOrders.length) / prevOrders.length) * 100
    : recentOrders.length > 0 ? 100 : 0;

  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE");
  const totalOrders = recentOrders.length;

  // Build 7-day revenue breakdown
  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const weeklyRevenue = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);
    const dayOrders = recentOrders.filter((o) => {
      const t = new Date(o.createdAt);
      return t >= dayStart && t <= dayEnd;
    });
    return {
      day: days[d.getDay()],
      revenue: calcRevenue(dayOrders as any),
      date: dayStart.toISOString(),
    };
  });

  const maxRevDay = weeklyRevenue.reduce((m, d) => (d.revenue > m.revenue ? d : m), weeklyRevenue[0]);
  const weeklyWithPeak = weeklyRevenue.map((d) => ({ ...d, peak: d.date === maxRevDay.date }));

  return NextResponse.json({
    stats: {
      revenue: thisMonthRevenue,
      revenueChange: Math.round(revenueChange * 10) / 10,
      followers: followerCount,
      followersChange: Math.round(followersChange * 10) / 10,
      orders: totalOrders,
      ordersChange: Math.round(ordersChange * 10) / 10,
      activeCampaigns: activeCampaigns.length,
    },
    weeklyRevenue: weeklyWithPeak,
    campaigns: campaigns.map((c) => ({
      id: c.id,
      title: c.title,
      raised: c.raised,
      goal: c.goal,
      backers: c._count.backers,
      deadline: c.deadline,
      status: c.status,
    })),
    recentOrders: recentOrders.slice(0, 5).map((o) => ({
      id: o.id,
      buyer: o.buyer,
      items: o.items,
      total: o.total,
      status: o.status,
      createdAt: o.createdAt,
    })),
    notifications,
    user,
  });
}
