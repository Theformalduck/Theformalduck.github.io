import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { sendEmail, orderConfirmationEmail, lowStockEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: any;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("[stripe webhook] signature verification failed:", err.message);
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const { buyerId, items: itemsJson, campaignId, rewardId, amount: campaignAmount, discountCode, creatorUsername } = session.metadata ?? {};

    // ── Campaign backing ──────────────────────────────────────────────────────
    if (campaignId) {
      const existing = await db.backer.findFirst({ where: { stripePaymentId: session.id } });
      if (!existing) {
        const amount = parseFloat(campaignAmount ?? "0");
        let finalBuyerId: string | null = buyerId || null;
        if (!finalBuyerId && session.customer_details?.email) {
          const u = await db.user.findUnique({ where: { email: session.customer_details.email }, select: { id: true } });
          if (u) finalBuyerId = u.id;
        }
        if (finalBuyerId) {
          await db.backer.create({
            data: {
              userId: finalBuyerId,
              campaignId,
              rewardId: rewardId || null,
              amount,
              stripePaymentId: session.id,
              status: "completed",
            },
          });
          await db.campaign.update({ where: { id: campaignId }, data: { raised: { increment: amount } } });
          if (rewardId) {
            await db.reward.update({ where: { id: rewardId }, data: { claimed: { increment: 1 } } });
          }
          const campaign = await db.campaign.findUnique({ where: { id: campaignId }, select: { userId: true, title: true } });
          if (campaign) {
            await db.notification.create({
              data: {
                userId: campaign.userId, type: "NEW_BACKER",
                title: "New campaign backer!",
                body: `Someone backed "${campaign.title}" with $${amount.toFixed(2)}.`,
                data: { campaignId },
              },
            });
          }
        }
      }
      return NextResponse.json({ received: true });
    }

    // ── Store order ───────────────────────────────────────────────────────────
    if (!itemsJson) return NextResponse.json({ received: true });

    // Idempotency — ignore if order already created (e.g. webhook retry or fallback already ran)
    const existing = await db.order.findFirst({ where: { stripeSessionId: session.id } });
    if (existing) return NextResponse.json({ received: true });

    const items = JSON.parse(itemsJson) as { productId: string; quantity: number }[];

    const products = await db.product.findMany({
      where: { id: { in: items.map(i => i.productId) } },
      select: { id: true, name: true, price: true, inventory: true, userId: true, type: true, digital: true },
    });

    // Resolve buyer — registered user or guest
    let finalBuyerId: string | null = buyerId || null;
    let guestEmail: string | null = null;

    if (!finalBuyerId && session.customer_details?.email) {
      const buyer = await db.user.findUnique({
        where: { email: session.customer_details.email },
        select: { id: true },
      });
      if (buyer) {
        finalBuyerId = buyer.id;
      } else {
        // Guest checkout — record email so seller knows who bought
        guestEmail = session.customer_details.email;
      }
    }

    const total = (session.amount_total ?? 0) / 100;

    const order = await db.order.create({
      data: {
        ...(finalBuyerId ? { buyerId: finalBuyerId } : {}),
        ...(guestEmail ? { guestEmail } : {}),
        total,
        status: "PENDING",
        stripeSessionId: session.id,
        items: {
          create: items.map(item => {
            const product = products.find(p => p.id === item.productId);
            return {
              productId: item.productId,
              quantity: item.quantity,
              price: product?.price ?? 0,
            };
          }),
        },
      },
    });

    // Decrement inventory for physical products
    await Promise.all(
      items.map(item => {
        const product = products.find(p => p.id === item.productId);
        if (product?.inventory == null) return Promise.resolve();
        return db.product.update({
          where: { id: item.productId },
          data: { inventory: { decrement: item.quantity } },
        });
      })
    );

    // Low-stock alerts — notify the seller when a product crosses their threshold.
    try {
      const sellerStoreIds = [...new Set(products.map(p => p.userId))];
      const stores = await db.store.findMany({ where: { userId: { in: sellerStoreIds } }, select: { userId: true, lowStockThreshold: true } });
      const thresholdByUser = new Map(stores.map(s => [s.userId, s.lowStockThreshold ?? 5]));
      for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        if (!product || product.inventory == null) continue; // inventory not tracked
        const threshold = thresholdByUser.get(product.userId) ?? 5;
        if (threshold <= 0) continue; // alerts disabled
        const oldInv = product.inventory;
        const newInv = oldInv - item.quantity;
        const crossedOut = oldInv > 0 && newInv <= 0;
        const crossedLow = !crossedOut && oldInv > threshold && newInv <= threshold;
        if (!crossedOut && !crossedLow) continue;
        const outOfStock = newInv <= 0;
        const left = Math.max(0, newInv);
        await db.notification.create({
          data: {
            userId: product.userId,
            type: "LOW_STOCK",
            title: outOfStock ? "Product out of stock" : "Low stock alert",
            body: outOfStock ? `"${product.name}" has sold out.` : `"${product.name}" is low — ${left} left in stock.`,
            data: { productId: product.id, inventory: left },
          },
        });
        const seller = await db.user.findUnique({ where: { id: product.userId }, select: { email: true } });
        if (seller?.email) {
          try {
            await sendEmail({
              to: seller.email,
              subject: outOfStock ? `Out of stock: ${product.name}` : `Low stock: ${product.name}`,
              html: lowStockEmail({ productName: product.name, inventory: left, productId: product.id, outOfStock }),
            });
          } catch (e) { console.error("[webhook] low-stock email failed:", e); }
        }
      }
    } catch (e) {
      console.error("[webhook] low-stock alert failed:", e);
    }

    // Count discount-code usage (idempotent with the order check above)
    if (discountCode && creatorUsername) {
      try {
        const creator = await db.user.findUnique({ where: { username: creatorUsername }, select: { id: true } });
        if (creator) {
          await db.discount.updateMany({
            where: { userId: creator.id, code: discountCode },
            data: { usageCount: { increment: 1 } },
          });
        }
      } catch (e) {
        console.error("[webhook] failed to increment discount usage:", e);
      }
    }

    // Notify the seller (in-app)
    const sellerIds = [...new Set(products.map(p => p.userId))];
    await Promise.all(
      sellerIds.map(sellerId =>
        db.notification.create({
          data: {
            userId: sellerId,
            type: "NEW_ORDER",
            title: "New order received!",
            body: `You received a $${total.toFixed(2)} order${guestEmail ? ` from ${guestEmail}` : ""}.`,
            data: { orderId: order.id },
          },
        })
      )
    );

    // Send order confirmation email to buyer
    const buyerEmail = guestEmail ?? session.customer_details?.email ?? null;
    if (buyerEmail) {
      try {
        const seller = await db.user.findFirst({
          where: { id: { in: sellerIds } },
          select: { username: true, store: { select: { name: true } } },
        });
        const storeName = seller?.store?.name ?? seller?.username ?? "the store";
        const storeUsername = seller?.username ?? "";
        const downloads = products
          .filter(p => p.type === "DIGITAL")
          .map(p => {
            const d = p.digital as { fileUrl?: string } | null;
            return d?.fileUrl ? { productName: p.name, fileUrl: d.fileUrl } : null;
          })
          .filter((d): d is { productName: string; fileUrl: string } => d !== null);

        await sendEmail({
          to: buyerEmail,
          subject: `Order confirmed — ${storeName}`,
          html: orderConfirmationEmail({
            id: order.id,
            total,
            storeName,
            storeUsername,
            downloads: downloads.length ? downloads : undefined,
            items: items.map(item => {
              const product = products.find(p => p.id === item.productId);
              return { name: product?.name ?? "Product", quantity: item.quantity, price: product?.price ?? 0 };
            }),
          }),
        });
      } catch (e) {
        console.error("[webhook] failed to send order confirmation:", e);
      }
    }
  }

  // ── Subscription created via checkout ────────────────────────────────────
  if (event.type === "checkout.session.completed" && (event.data.object as any).mode === "subscription") {
    const session = event.data.object as any;
    const { buyerId, productId, creatorId } = session.metadata ?? {};
    if (buyerId && productId && creatorId && session.subscription) {
      const existing = await db.subscription.findUnique({ where: { stripeSubscriptionId: session.subscription } });
      if (!existing) {
        const stripeSub = await stripe!.subscriptions.retrieve(session.subscription);
        await db.subscription.create({
          data: {
            subscriberId: buyerId,
            productId,
            creatorId,
            stripeSubscriptionId: session.subscription,
            stripeCustomerId: typeof stripeSub.customer === "string" ? stripeSub.customer : stripeSub.customer.id,
            status: stripeSub.status,
            currentPeriodEnd: new Date((stripeSub as any).current_period_end * 1000),
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
          },
        });
      }
    }
  }

  // ── Subscription updated (renewal, cancellation toggle, etc.) ────────────
  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const stripeSub = event.data.object as any;
    await db.subscription.updateMany({
      where: { stripeSubscriptionId: stripeSub.id },
      data: {
        status: event.type === "customer.subscription.deleted" ? "cancelled" : stripeSub.status,
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      },
    });
  }

  // ── Invoice paid (subscription renewal) ───────────────────────────────────
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as any;
    if (invoice.subscription) {
      await db.subscription.updateMany({
        where: { stripeSubscriptionId: invoice.subscription },
        data: { status: "active" },
      });
    }
  }

  // ── Invoice payment failed ────────────────────────────────────────────────
  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as any;
    if (invoice.subscription) {
      await db.subscription.updateMany({
        where: { stripeSubscriptionId: invoice.subscription },
        data: { status: "past_due" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
