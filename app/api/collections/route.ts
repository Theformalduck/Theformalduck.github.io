import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizeField, sanitizeArray, sanitizeUrl } from "@/lib/sanitize";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "collection";
}

async function uniqueSlug(userId: string, base: string, excludeId?: string) {
  let slug = base;
  let n = 1;
  // Find a free slug for this owner.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await db.collection.findFirst({ where: { userId, slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) }, select: { id: true } });
    if (!existing) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const collections = await db.collection.findMany({
    where: { userId: session.user.id },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    include: {
      _count: { select: { products: true } },
      products: { select: { id: true } },
    },
  });
  return NextResponse.json(collections);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const name = sanitizeField(body.name, 120);
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const description = sanitizeField(body.description, 2000) || null;
    const image = sanitizeUrl(body.image);
    const productIds = sanitizeArray(body.productIds, false, 60);

    // Only attach products the owner actually owns.
    const owned = await db.product.findMany({
      where: { id: { in: productIds }, userId: session.user.id },
      select: { id: true },
    });

    const slug = await uniqueSlug(session.user.id, slugify(name));
    const count = await db.collection.count({ where: { userId: session.user.id } });

    const collection = await db.collection.create({
      data: {
        userId: session.user.id,
        name, description, image, slug, position: count,
        products: { connect: owned.map(p => ({ id: p.id })) },
      },
      include: { _count: { select: { products: true } }, products: { select: { id: true } } },
    });
    return NextResponse.json(collection, { status: 201 });
  } catch (err) {
    console.error("[collections POST]", err);
    return NextResponse.json({ error: "Failed to create collection" }, { status: 500 });
  }
}
