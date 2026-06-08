import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveAccount, can } from "@/lib/team";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await getActiveAccount(session.user.id);
  if (!can(account, "orders")) return NextResponse.json({ error: "You don't have permission to manage orders." }, { status: 403 });

  const orders = await db.order.findMany({
    where: {
      items: {
        some: {
          product: { userId: account.ownerId },
        },
      },
    },
    include: {
      items: {
        where: { product: { userId: account.ownerId } },
        include: { product: { select: { id: true, name: true, type: true } } },
      },
      buyer: { select: { id: true, name: true, username: true, image: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(orders.map(o => ({
    ...o,
    // Surface guest email as a fallback buyer label for the dashboard UI
    buyerLabel: o.buyer?.name ?? o.buyer?.email ?? (o as any).guestEmail ?? "Guest",
  })));
}
