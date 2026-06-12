import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripeEnabled, createCheckoutSession } from "@/lib/stripe";
import { normalizeCode, checkDiscount } from "@/lib/discounts";

export async function POST(req: NextRequest) {
  if (!stripeEnabled) {
    return NextResponse.json(
      { error: "Payments are not configured yet. Add STRIPE_SECRET_KEY to your environment variables." },
      { status: 503 }
    );
  }

  const session = await auth();

  try {
    const body = await req.json();
    const { items, creatorUsername, discountCode } = body as {
      items: { productId: string; quantity: number }[];
      creatorUsername: string;
      discountCode?: string;
    };

    if (!items?.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const productIds = items.map((i) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds }, status: "ACTIVE" },
      select: { id: true, name: true, description: true, price: true, images: true, inventory: true, type: true, userId: true },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "One or more products are unavailable" }, { status: 400 });
    }

    // Inventory check
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)!;
      if (product.inventory !== null && product.inventory < item.quantity) {
        return NextResponse.json({ error: `Not enough stock for "${product.name}"` }, { status: 400 });
      }
    }

    // Subscriptions need recurring Prices provisioned on each seller's connected
    // account, which one-off Checkout can't do. Degrade clearly.
    if (products.some((p) => p.type === "SUBSCRIPTION")) {
      return NextResponse.json(
        { error: "Subscription products aren't available with this checkout yet." },
        { status: 400 }
      );
    }

    const origin = req.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "";

    const creator = await db.user.findUnique({
      where: { username: creatorUsername },
      select: { id: true, stripeAccountId: true, store: { select: { name: true, localPickupOnly: true } } },
    });

    if (!creator?.stripeAccountId) {
      return NextResponse.json({ error: "This store is not set up to accept payments yet." }, { status: 400 });
    }

    const lineItems = items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      return { name: product.name, quantity: item.quantity, unitPrice: product.price };
    });
    const subtotal = items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId)!;
      return sum + product.price * item.quantity;
    }, 0);

    // ── Discount code (optional) ──────────────────────────────────────────────
    let appliedCode = "";
    let discountAmount = 0;
    const normalizedCode = normalizeCode(discountCode ?? "");
    if (normalizedCode) {
      const discount = await db.discount.findFirst({ where: { userId: creator.id, code: normalizedCode } });
      const check = checkDiscount(discount, Math.round(subtotal * 100));
      if (!check.ok) {
        return NextResponse.json({ error: check.reason }, { status: 400 });
      }
      discountAmount = check.amountCents / 100;
      appliedCode = normalizedCode;
    }

    const total = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

    // Destination charge → funds transfer to the seller's connected account,
    // platform takes the application fee.
    const checkout = await createCheckoutSession({
      sellerAccountId: creator.stripeAccountId,
      currency: "USD",
      items: lineItems,
      total,
      customId: creatorUsername,
      description: `Order from ${creator.store?.name ?? creatorUsername}`,
      successUrl: `${origin}/${creatorUsername}/store?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/${creatorUsername}/store?stripe=cancelled`,
      brandName: creator.store?.name ?? "Sellora",
      buyerEmail: session?.user?.email ?? null,
      // Ask for a shipping address whenever something physical is in the cart,
      // unless the store is local-pickup-only (buyers collect in person).
      collectShipping: !creator.store?.localPickupOnly && products.some((p) => p.type === "PHYSICAL"),
    });

    // Stash the cart context to fulfill on return (keyed by the session id).
    await db.pendingCheckout.create({
      data: {
        id: checkout.id,
        kind: "store",
        data: {
          items,
          buyerId: session?.user?.id ?? null,
          discountCode: appliedCode || null,
          creatorUsername,
          total,
        },
      },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    console.error("[checkout POST]", err);
    const msg = err instanceof Error ? err.message : String(err);
    // Surface the underlying reason so checkout failures are diagnosable instead
    // of a blank "Failed to create checkout session".
    return NextResponse.json(
      { error: `Couldn't start checkout: ${msg}` },
      { status: 500 }
    );
  }
}
