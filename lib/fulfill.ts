import { db } from "@/lib/db";
import { sendEmailAfter, orderConfirmationEmail, lowStockEmail } from "@/lib/email";
import { notify } from "@/lib/notify";

export interface FulfillStoreParams {
  stripeSessionId: string;
  stripePaymentIntentId?: string | null;
  items: { productId: string; quantity: number }[];
  total: number;
  buyerId?: string | null;
  buyerEmail?: string | null;   // payer email from Stripe, for guest resolution + confirmation
  discountCode?: string | null;
  creatorUsername?: string | null;
}

// Create the order + run all post-payment side effects (inventory, low-stock
// alerts, discount usage, seller notifications, buyer confirmation email).
// Idempotent on stripeSessionId, so it is safe to call from both the confirm
// endpoint and a Stripe webhook.
export async function fulfillStoreOrder(p: FulfillStoreParams): Promise<{ orderId: string; created: boolean }> {
  const existing = await db.order.findFirst({ where: { stripeSessionId: p.stripeSessionId } });
  if (existing) return { orderId: existing.id, created: false };

  const products = await db.product.findMany({
    where: { id: { in: p.items.map((i) => i.productId) } },
    select: { id: true, name: true, price: true, inventory: true, userId: true, type: true, digital: true },
  });

  let finalBuyerId: string | null = p.buyerId || null;
  let guestEmail: string | null = null;
  if (!finalBuyerId && p.buyerEmail) {
    const buyer = await db.user.findUnique({ where: { email: p.buyerEmail }, select: { id: true } });
    if (buyer) finalBuyerId = buyer.id;
    else guestEmail = p.buyerEmail;
  }

  let order;
  try {
    order = await db.order.create({
      data: {
        ...(finalBuyerId ? { buyerId: finalBuyerId } : {}),
        ...(guestEmail ? { guestEmail } : {}),
        total: p.total,
        status: "PENDING",
        stripeSessionId: p.stripeSessionId,
        ...(p.stripePaymentIntentId ? { stripePaymentIntentId: p.stripePaymentIntentId } : {}),
        items: {
          create: p.items.map((item) => {
            const product = products.find((pr) => pr.id === item.productId);
            return { productId: item.productId, quantity: item.quantity, price: product?.price ?? 0 };
          }),
        },
      },
    });
  } catch (e: any) {
    // Unique-constraint race: another concurrent call already fulfilled this
    // session. Return that order and skip the side effects (idempotent).
    if (e?.code === "P2002") {
      const dup = await db.order.findFirst({ where: { stripeSessionId: p.stripeSessionId } });
      if (dup) return { orderId: dup.id, created: false };
    }
    throw e;
  }

  // Decrement inventory for tracked products.
  await Promise.all(
    p.items.map((item) => {
      const product = products.find((pr) => pr.id === item.productId);
      if (product?.inventory == null) return Promise.resolve();
      return db.product.update({ where: { id: item.productId }, data: { inventory: { decrement: item.quantity } } });
    })
  );

  // Low-stock alerts (computed from pre-decrement inventory).
  try {
    const sellerStoreIds = [...new Set(products.map((pr) => pr.userId))];
    const stores = await db.store.findMany({ where: { userId: { in: sellerStoreIds } }, select: { userId: true, lowStockThreshold: true } });
    const thresholdByUser = new Map(stores.map((s) => [s.userId, s.lowStockThreshold ?? 5]));
    for (const item of p.items) {
      const product = products.find((pr) => pr.id === item.productId);
      if (!product || product.inventory == null) continue;
      const threshold = thresholdByUser.get(product.userId) ?? 5;
      if (threshold <= 0) continue;
      const oldInv = product.inventory;
      const newInv = oldInv - item.quantity;
      const crossedOut = oldInv > 0 && newInv <= 0;
      const crossedLow = !crossedOut && oldInv > threshold && newInv <= threshold;
      if (!crossedOut && !crossedLow) continue;
      const outOfStock = newInv <= 0;
      const left = Math.max(0, newInv);
      await db.notification.create({
        data: {
          userId: product.userId, type: "LOW_STOCK",
          title: outOfStock ? "Product out of stock" : "Low stock alert",
          body: outOfStock ? `"${product.name}" has sold out.` : `"${product.name}" is low – ${left} left in stock.`,
          data: { productId: product.id, inventory: left },
        },
      });
      const seller = await db.user.findUnique({ where: { id: product.userId }, select: { email: true } });
      if (seller?.email) {
        sendEmailAfter({ to: seller.email, subject: outOfStock ? `Out of stock: ${product.name}` : `Low stock: ${product.name}`, html: lowStockEmail({ productName: product.name, inventory: left, productId: product.id, outOfStock }) });
      }
    }
  } catch (e) {
    console.error("[fulfill] low-stock alert failed:", e);
  }

  // Discount-code usage.
  if (p.discountCode && p.creatorUsername) {
    try {
      const creator = await db.user.findUnique({ where: { username: p.creatorUsername }, select: { id: true } });
      if (creator) {
        await db.discount.updateMany({ where: { userId: creator.id, code: p.discountCode }, data: { usageCount: { increment: 1 } } });
      }
    } catch (e) { console.error("[fulfill] discount usage failed:", e); }
  }

  // Notify sellers (in-app).
  const sellerIds = [...new Set(products.map((pr) => pr.userId))];
  await Promise.all(
    sellerIds.map((sellerId) =>
      notify({
        userId: sellerId, type: "NEW_ORDER",
        title: "New order received!",
        body: `You received a $${p.total.toFixed(2)} order${guestEmail ? ` from ${guestEmail}` : ""}.`,
        data: { orderId: order.id },
        link: "/store/orders",
      })
    )
  );

  // Buyer confirmation email.
  const buyerEmail = guestEmail ?? p.buyerEmail ?? null;
  if (buyerEmail) {
    try {
      const seller = await db.user.findFirst({ where: { id: { in: sellerIds } }, select: { username: true, store: { select: { name: true } } } });
      const storeName = seller?.store?.name ?? seller?.username ?? "the store";
      const storeUsername = seller?.username ?? "";
      const downloads = products
        .filter((pr) => pr.type === "DIGITAL")
        .map((pr) => { const d = pr.digital as { fileUrl?: string } | null; return d?.fileUrl ? { productName: pr.name, fileUrl: d.fileUrl } : null; })
        .filter((d): d is { productName: string; fileUrl: string } => d !== null);
      sendEmailAfter({
        to: buyerEmail,
        subject: `Order confirmed – ${storeName}`,
        html: orderConfirmationEmail({
          id: order.id, total: p.total, storeName, storeUsername,
          downloads: downloads.length ? downloads : undefined,
          items: p.items.map((item) => { const product = products.find((pr) => pr.id === item.productId); return { name: product?.name ?? "Product", quantity: item.quantity, price: product?.price ?? 0 }; }),
        }),
      });
    } catch (e) { console.error("[fulfill] confirmation email failed:", e); }
  }

  return { orderId: order.id, created: true };
}

// Crowdfunding pledge fulfillment, create the backer, bump raised/claimed, notify.
// Idempotent on paypalOrderId.
export async function fulfillCampaignBacking(p: {
  stripeSessionId: string;
  campaignId: string;
  rewardId: string | null;
  amount: number;
  buyerId: string | null;
}): Promise<{ backerId: string | null; created: boolean }> {
  const existing = await db.backer.findFirst({ where: { stripePaymentId: p.stripeSessionId } });
  if (existing) return { backerId: existing.id, created: false };
  if (!p.buyerId) return { backerId: null, created: false }; // backing requires a signed-in user

  let backer;
  try {
    backer = await db.backer.create({
      data: { userId: p.buyerId, campaignId: p.campaignId, rewardId: p.rewardId || null, amount: p.amount, stripePaymentId: p.stripeSessionId, status: "completed" },
    });
  } catch (e: any) {
    // Concurrent fulfillment of the same pledge, return the existing one.
    if (e?.code === "P2002") {
      const dup = await db.backer.findFirst({ where: { stripePaymentId: p.stripeSessionId } });
      if (dup) return { backerId: dup.id, created: false };
    }
    throw e;
  }
  await db.campaign.update({ where: { id: p.campaignId }, data: { raised: { increment: p.amount } } });
  if (p.rewardId) await db.reward.update({ where: { id: p.rewardId }, data: { claimed: { increment: 1 } } });

  const campaign = await db.campaign.findUnique({ where: { id: p.campaignId }, select: { userId: true, title: true } });
  if (campaign) {
    await notify({
      userId: campaign.userId, type: "NEW_BACKER",
      title: "New campaign backer!",
      body: `Someone backed "${campaign.title}" with $${p.amount.toFixed(2)}.`,
      data: { campaignId: p.campaignId },
      link: "/campaigns",
    });
  }
  return { backerId: backer.id, created: true };
}
