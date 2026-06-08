import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizeField, sanitizeArray, sanitizeUrl } from "@/lib/sanitize";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "collection";
}

async function uniqueSlug(userId: string, base: string, excludeId: string) {
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await db.collection.findFirst({ where: { userId, slug, NOT: { id: excludeId } }, select: { id: true } });
    if (!existing) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

async function owns(userId: string, id: string) {
  const c = await db.collection.findUnique({ where: { id }, select: { userId: true } });
  return c?.userId === userId;
}

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await props.params;

  const collection = await db.collection.findUnique({
    where: { id },
    include: { products: { select: { id: true } }, _count: { select: { products: true } } },
  });
  if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (collection.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(collection);
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await props.params;
  if (!(await owns(session.user.id, id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const name = body.name !== undefined ? sanitizeField(body.name, 120) : undefined;
    const description = body.description !== undefined ? (sanitizeField(body.description, 2000) || null) : undefined;
    const image = body.image !== undefined ? sanitizeUrl(body.image) : undefined;

    let productConnect: { set: { id: string }[] } | undefined;
    if (body.productIds !== undefined) {
      const productIds = sanitizeArray(body.productIds, false, 60);
      const owned = await db.product.findMany({ where: { id: { in: productIds }, userId: session.user.id }, select: { id: true } });
      productConnect = { set: owned.map(p => ({ id: p.id })) };
    }

    const slug = name ? await uniqueSlug(session.user.id, slugify(name), id) : undefined;

    const collection = await db.collection.update({
      where: { id },
      data: {
        ...(name !== undefined && name ? { name } : {}),
        ...(slug ? { slug } : {}),
        ...(description !== undefined && { description }),
        ...(image !== undefined && { image }),
        ...(productConnect && { products: productConnect }),
      },
      include: { products: { select: { id: true } }, _count: { select: { products: true } } },
    });
    return NextResponse.json(collection);
  } catch (err) {
    console.error("[collections/[id] PUT]", err);
    return NextResponse.json({ error: "Failed to update collection" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await props.params;
  if (!(await owns(session.user.id, id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.collection.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
