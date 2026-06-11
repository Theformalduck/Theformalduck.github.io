import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Permanently delete the signed-in user's account and all their data.
//
// Most relations cascade from User, but a few use Restrict and would block the
// delete, so we clear them first in a transaction:
//   • Backer       , pledges the user made, and pledges others made to the
//                     user's campaigns
//   • Subscription , where the user is the subscriber, the creator, or owns
//                     the product
//   • OrderItem    , line items for the user's products (lets the products
//                     cascade-delete; the parent orders are kept for the buyer)
// Orders the user *placed* keep their record with buyerId set to null.
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  try {
    const user = await db.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
    if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    // Require the typed confirmation, and the password for password accounts.
    const body = await req.json().catch(() => ({}));
    if (String(body?.confirm ?? "").trim().toUpperCase() !== "DELETE") {
      return NextResponse.json({ error: "Please type DELETE to confirm." }, { status: 400 });
    }
    if (user.passwordHash) {
      const ok = body?.password && (await bcrypt.compare(String(body.password), user.passwordHash));
      if (!ok) return NextResponse.json({ error: "Incorrect password." }, { status: 400 });
    }

    const products = await db.product.findMany({ where: { userId }, select: { id: true } });
    const productIds = products.map((p) => p.id);
    const campaigns = await db.campaign.findMany({ where: { userId }, select: { id: true } });
    const campaignIds = campaigns.map((c) => c.id);

    await db.$transaction(async (tx) => {
      await tx.backer.deleteMany({
        where: { OR: [{ userId }, ...(campaignIds.length ? [{ campaignId: { in: campaignIds } }] : [])] },
      });
      await tx.subscription.deleteMany({
        where: { OR: [{ subscriberId: userId }, { creatorId: userId }, ...(productIds.length ? [{ productId: { in: productIds } }] : [])] },
      });
      if (productIds.length) {
        await tx.orderItem.deleteMany({ where: { productId: { in: productIds } } });
      }
      await tx.user.delete({ where: { id: userId } });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[user/delete]", err);
    return NextResponse.json({ error: "Failed to delete account. Please try again." }, { status: 500 });
  }
}
