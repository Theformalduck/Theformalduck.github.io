import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: orderId } = await props.params;

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, type: true, digital: true } },
        },
      },
    },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.buyerId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (order.status === "CANCELLED" || order.status === "REFUNDED") {
    return NextResponse.json({ error: "Downloads are not available for cancelled or refunded orders" }, { status: 400 });
  }

  const digitalItems = order.items
    .filter(item => item.product.type === "DIGITAL")
    .map(item => {
      const digital = item.product.digital as { fileUrl?: string; downloadLimit?: number } | null;
      return {
        productId: item.product.id,
        productName: item.product.name,
        fileUrl: digital?.fileUrl ?? null,
      };
    })
    .filter(item => item.fileUrl);

  if (!digitalItems.length) {
    return NextResponse.json({ error: "No digital files for this order" }, { status: 404 });
  }

  return NextResponse.json({ downloads: digitalItems });
}
