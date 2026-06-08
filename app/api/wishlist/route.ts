import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// List the current user's wishlist. `?detailed=1` returns full product cards.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ productIds: [], items: [] });

  const detailed = new URL(req.url).searchParams.get("detailed") === "1";
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      wishlist: detailed
        ? {
            where: { status: "ACTIVE" },
            select: {
              id: true, name: true, price: true, comparePrice: true, images: true, type: true,
              user: { select: { username: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
          }
        : { select: { id: true } },
    },
  });

  if (detailed) {
    const items = (user?.wishlist ?? []).map((p: any) => ({
      id: p.id, name: p.name, price: p.price, comparePrice: p.comparePrice,
      images: p.images, type: p.type,
      sellerUsername: p.user?.username ?? "", sellerName: p.user?.name ?? "",
    }));
    return NextResponse.json({ items });
  }
  return NextResponse.json({ productIds: (user?.wishlist ?? []).map(p => p.id) });
}

// Add a product to the wishlist.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to save items" }, { status: 401 });

  const { productId } = await req.json();
  if (!productId || typeof productId !== "string") return NextResponse.json({ error: "productId required" }, { status: 400 });

  const product = await db.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  await db.user.update({
    where: { id: session.user.id },
    data: { wishlist: { connect: { id: productId } } },
  });
  return NextResponse.json({ ok: true, wishlisted: true });
}

// Remove a product from the wishlist (?productId=...).
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const productId = new URL(req.url).searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  await db.user.update({
    where: { id: session.user.id },
    data: { wishlist: { disconnect: { id: productId } } },
  });
  return NextResponse.json({ ok: true, wishlisted: false });
}
