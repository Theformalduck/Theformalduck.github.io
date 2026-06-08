import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await db.order.findMany({
    where: { buyerId: session.user.id },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, type: true, images: true, digital: true, userId: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(orders);
}
