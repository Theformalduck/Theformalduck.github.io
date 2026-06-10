import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { captureError } from "@/lib/logger";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  try {
  const now = new Date();

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(now.getDate() - 60);

  const [currentOrders, prevOrders, topProductsRaw] = await Promise.all([
    db.order.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        items: { some: { product: { userId } } },
      },
      include: {
        items: {
          where: { product: { userId } },
          include: { product: { select: { name: true, type: true } } },
        },
        buyer: { select: { id: true } },
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
          include: { product: { select: { name: true, type: true } } },
        },
        buyer: { select: { id: true } },
      },
    }),
    db.orderItem.findMany({
      where: { product: { userId } },
      include: { product: { select: { name: true, type: true } } },
      orderBy: { order: { createdAt: "desc" } },
    }),
  ]);

  const calcRevenue = (orders: typeof currentOrders) =>
    orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.price * i.quantity, 0), 0);

  const currentRevenue = calcRevenue(currentOrders);
  const prevRevenue = calcRevenue(prevOrders);
  const revenueChange = prevRevenue > 0
    ? Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 1000) / 10
    : currentRevenue > 0 ? 100 : 0;

  const currentOrderCount = currentOrders.length;
  const prevOrderCount = prevOrders.length;
  const ordersChange = prevOrderCount > 0
    ? Math.round(((currentOrderCount - prevOrderCount) / prevOrderCount) * 1000) / 10
    : currentOrderCount > 0 ? 100 : 0;

  const uniqueBuyers = new Set(
    currentOrders.map(o => o.buyerId ?? o.guestEmail ?? "guest").filter(Boolean)
  ).size;

  const uniqueBuyersPrev = new Set(
    prevOrders.map(o => o.buyerId ?? o.guestEmail ?? "guest").filter(Boolean)
  ).size;
  const uniqueBuyersChange = uniqueBuyersPrev > 0
    ? Math.round(((uniqueBuyers - uniqueBuyersPrev) / uniqueBuyersPrev) * 1000) / 10
    : uniqueBuyers > 0 ? 100 : 0;

  // 30-day daily revenue
  const dailyRevenue = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (29 - i));
    const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
    const dayEnd   = new Date(d); dayEnd.setHours(23, 59, 59, 999);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    const dayOrders = currentOrders.filter(o => {
      const t = new Date(o.createdAt);
      return t >= dayStart && t <= dayEnd;
    });
    return { date: label, revenue: calcRevenue(dayOrders), orders: dayOrders.length };
  });

  // Top products by revenue (all time)
  const productRevMap = new Map<string, { name: string; type: string; revenue: number; units: number }>();
  for (const item of topProductsRaw) {
    const existing = productRevMap.get(item.productId);
    if (existing) {
      existing.revenue += item.price * item.quantity;
      existing.units   += item.quantity;
    } else {
      productRevMap.set(item.productId, {
        name: item.product.name,
        type: item.product.type,
        revenue: item.price * item.quantity,
        units: item.quantity,
      });
    }
  }
  const topProducts = [...productRevMap.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Revenue by product type (current period)
  const typeRevMap = new Map<string, number>();
  for (const order of currentOrders) {
    for (const item of order.items) {
      const type = item.product.type;
      typeRevMap.set(type, (typeRevMap.get(type) ?? 0) + item.price * item.quantity);
    }
  }
  const revenueByType = [...typeRevMap.entries()].map(([type, revenue]) => ({ type, revenue }));

  return NextResponse.json({
    stats: {
      revenue: currentRevenue,
      revenueChange,
      orders: currentOrderCount,
      ordersChange,
      uniqueBuyers,
      uniqueBuyersChange,
    },
    dailyRevenue,
    topProducts,
    revenueByType,
  });
  } catch (err) {
    captureError(err, { route: "/api/analytics", userId });
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
