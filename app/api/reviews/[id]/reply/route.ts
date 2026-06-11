import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizeField } from "@/lib/sanitize";
import { moderateText } from "@/lib/moderation";
import { notify } from "@/lib/notify";

// The store owner posts (or clears) a public reply to a review on their product.
export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await props.params;

  const review = await db.review.findUnique({
    where: { id },
    select: { id: true, authorId: true, product: { select: { userId: true, name: true } } },
  });
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (review.product.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const reply = sanitizeField(body.reply, 2000).trim();

  const mod = moderateText(reply);
  if (!mod.ok) return NextResponse.json({ error: mod.reason }, { status: 422 });

  const updated = await db.review.update({
    where: { id },
    data: {
      sellerReply: reply || null,
      sellerRepliedAt: reply ? new Date() : null,
    },
    include: { author: { select: { id: true, name: true, image: true, username: true } } },
  });

  // Notify the reviewer that the seller responded.
  if (reply && review.authorId !== session.user.id) {
    try {
      await notify({
        userId: review.authorId,
        type: "REVIEW_REPLY",
        title: "The seller replied to your review",
        body: `Your review of "${review.product.name}" got a response.`,
        data: { productId: (await db.review.findUnique({ where: { id }, select: { productId: true } }))?.productId ?? undefined },
        link: "/orders",
      });
    } catch (e) { console.error("[review reply] notify failed:", e); }
  }

  return NextResponse.json(updated);
}
