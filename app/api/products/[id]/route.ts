import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizeField, sanitizeArray, sanitizeMetafields } from "@/lib/sanitize";
import { getActiveAccount, can } from "@/lib/team";

async function ownsProduct(ownerId: string, productId: string) {
  const p = await db.product.findUnique({ where: { id: productId }, select: { userId: true } });
  return p?.userId === ownerId;
}

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await getActiveAccount(session.user.id);
  if (!can(account, "products")) return NextResponse.json({ error: "You don't have permission to manage products." }, { status: 403 });

  const { id } = await props.params;
  const product = await db.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: { id: "asc" } },
      _count: { select: { orderItems: true, reviews: true } },
      reviews: { select: { rating: true } },
    },
  });

  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (product.userId !== account.ownerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await getActiveAccount(session.user.id);
  if (!can(account, "products")) return NextResponse.json({ error: "You don't have permission to manage products." }, { status: 403 });

  const { id } = await props.params;
  if (!(await ownsProduct(account.ownerId, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const name        = body.name !== undefined ? sanitizeField(body.name, 200) : undefined;
    const description = body.description !== undefined ? (sanitizeField(body.description, 10000) || null) : undefined;
    const images      = body.images !== undefined ? sanitizeArray(body.images, true) : undefined;
    const metafields  = body.metafields !== undefined ? sanitizeMetafields(body.metafields) : undefined;
    const { price, comparePrice, type, status, inventory, digital, variants } = body;

    const validTypes = ["DIGITAL", "PHYSICAL", "SERVICE", "SUBSCRIPTION"];

    const product = await db.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: Number(price) }),
        ...(comparePrice !== undefined && { comparePrice: comparePrice != null ? Number(comparePrice) : null }),
        ...(type !== undefined && validTypes.includes(type) && { type }),
        ...(status !== undefined && { status }),
        ...(images !== undefined && { images }),
        ...(inventory !== undefined && { inventory: inventory != null ? Number(inventory) : null }),
        ...(metafields !== undefined && { metafields }),
        ...(digital !== undefined && { digital }),
        ...(variants !== undefined && {
          variants: {
            deleteMany: {},
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
      include: { variants: { orderBy: { id: "asc" } } },
    });

    return NextResponse.json(product);
  } catch (err) {
    console.error("[products/[id] PUT]", err);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await getActiveAccount(session.user.id);
  if (!can(account, "products")) return NextResponse.json({ error: "You don't have permission to manage products." }, { status: 403 });

  const { id } = await props.params;
  if (!(await ownsProduct(account.ownerId, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
