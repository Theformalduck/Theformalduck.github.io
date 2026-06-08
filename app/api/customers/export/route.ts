import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { toCsv } from "@/lib/csv";
import { getActiveAccount, can } from "@/lib/team";

// Export the active account's customers (everyone who has ordered), aggregated.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await getActiveAccount(session.user.id);
  if (!can(account, "orders")) return NextResponse.json({ error: "You don't have permission to export customers." }, { status: 403 });

  const orders = await db.order.findMany({
    where: { items: { some: { product: { userId: account.ownerId } } } },
    select: { total: true, createdAt: true, guestEmail: true, buyer: { select: { name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  const map = new Map<string, { name: string; email: string; orders: number; spent: number; first: Date; last: Date }>();
  for (const o of orders) {
    const email = (o.buyer?.email ?? o.guestEmail ?? "").toLowerCase();
    if (!email) continue;
    const name = o.buyer?.name ?? "Guest";
    const existing = map.get(email);
    if (existing) {
      existing.orders += 1;
      existing.spent += o.total;
      if (o.createdAt < existing.first) existing.first = o.createdAt;
      if (o.createdAt > existing.last) existing.last = o.createdAt;
      if (name !== "Guest") existing.name = name;
    } else {
      map.set(email, { name, email, orders: 1, spent: o.total, first: o.createdAt, last: o.createdAt });
    }
  }

  const customers = [...map.values()].sort((a, b) => b.spent - a.spent);
  const rows: (string | number | null)[][] = [
    ["name", "email", "orders", "total_spent", "first_order", "last_order"],
    ...customers.map((c) => [c.name, c.email, c.orders, c.spent.toFixed(2), c.first.toISOString().slice(0, 10), c.last.toISOString().slice(0, 10)]),
  ];

  return new NextResponse(toCsv(rows), {
    headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="customers.csv"` },
  });
}
