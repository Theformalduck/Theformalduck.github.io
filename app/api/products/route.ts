import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizeField, sanitizeArray, sanitizeMetafields } from "@/lib/sanitize";
import { getActiveAccount, can } from "@/lib/team";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await getActiveAccount(session.user.id);
  if (!can(account, "products")) return NextResponse.json({ error: "You don't have permission to manage products." }, { status: 403 });

  const products = await db.product.findMany({
    where: { userId: account.ownerId },
    include: {
      _count: { select: { orderItems: true, reviews: true } },
      reviews: { select: { rating: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await getActiveAccount(session.user.id);
  if (!can(account, "products")) return NextResponse.json({ error: "You don't have permission to manage products." }, { status: 403 });

  try {
    const body = await req.json();
    const name        = sanitizeField(body.name, 200);
    const description = sanitizeField(body.description, 10000) || null;
    const images      = sanitizeArray(body.images, true);
    const metafields  = sanitizeMetafields(body.metafields);
    const { price, comparePrice, type, status, inventory, digital, variants } = body;

    if (!name || !price || !type) {
      return NextResponse.json({ error: "name, price, and type are required" }, { status: 400 });
    }

    const validTypes = ["DIGITAL", "PHYSICAL", "SERVICE", "SUBSCRIPTION"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid product type" }, { status: 400 });
    }

    const product = await db.product.create({
      data: {
        userId: account.ownerId,
        name,
        description: description ?? null,
        price: Number(price),
        comparePrice: comparePrice != null ? Number(comparePrice) : null,
        type,
        status: status === "ACTIVE" ? "ACTIVE" : "DRAFT",
        images: images ?? [],
        inventory: inventory != null ? Number(inventory) : null,
        metafields,
        ...(digital != null && { digital }),
        ...(variants?.length && {
          variants: {
            create: (variants as { optionType: string; name: string; colorHex?: string; image?: string; price?: number; inventory?: number }[]).map(v => ({
              optionType: v.optionType,
              name: v.name,
              colorHex: v.colorHex ?? null,
              image: v.image ?? null,
              price: v.price ?? null,
              inventory: v.inventory ?? null,
            })),
          },
        }),
      },
      include: { variants: true },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    console.error("[products POST]", err);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
