import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { toCsv } from "@/lib/csv";
import { getActiveAccount, can } from "@/lib/team";

// Export the active account's orders as a CSV.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await getActiveAccount(session.user.id);
  if (!can(account, "orders")) return NextResponse.json({ error: "You don't have permission to export orders." }, { status: 403 });

  const orders = await db.order.findMany({
    where: { items: { some: { product: { userId: account.ownerId } } } },
    include: {
      items: { where: { product: { userId: account.ownerId } }, include: { product: { select: { name: true } } } },
      buyer: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const header = ["order_id", "date", "status", "total", "customer", "email", "items", "quantity", "tracking_number", "tracking_url"];
  const rows: (string | number | null)[][] = [
    header,
    ...orders.map((o) => {
      const itemsStr = o.items.map((i) => `${i.product?.name ?? "Item"} x${i.quantity}`).join("; ");
      const qty = o.items.reduce((s, i) => s + i.quantity, 0);
      return [
        o.id,
        o.createdAt.toISOString().slice(0, 10),
        o.status,
        o.total.toFixed(2),
        o.buyer?.name ?? "Guest",
        o.buyer?.email ?? o.guestEmail ?? "",
        itemsStr,
        qty,
        o.trackingNumber ?? "",
        o.trackingUrl ?? "",
      ];
    }),
  ];

  return new NextResponse(toCsv(rows), {
    headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="orders.csv"` },
  });
}
