import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { moderateText } from "@/lib/moderation";

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  const reviews = await db.review.findMany({
    where: { productId: id },
    include: { author: { select: { id: true, name: true, image: true, username: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reviews);
}

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await props.params;
  const { rating, comment } = await req.json();

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  const mod = moderateText(typeof comment === "string" ? comment : "");
  if (!mod.ok) return NextResponse.json({ error: mod.reason }, { status: 422 });

  const product = await db.product.findUnique({ where: { id }, select: { id: true } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  try {
    const review = await db.review.create({
      data: {
        productId: id,
        authorId: session.user.id,
        rating: Number(rating),
        comment: comment?.trim() || null,
      },
      include: { author: { select: { id: true, name: true, image: true, username: true } } },
    });
    return NextResponse.json(review, { status: 201 });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "You have already reviewed this product" }, { status: 409 });
    }
    console.error("[reviews POST]", err);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
