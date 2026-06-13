export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DEFAULT_SETTINGS, type StoreSettings } from "@/lib/store-themes";
import CartClient from "./cart-client";

export const metadata: Metadata = { title: "Cart", robots: { index: false } };

export default async function CartPage(props: PageProps<"/[username]/store/cart">) {
  const { username } = await props.params;

  const user = await db.user.findUnique({
    where: { username },
    select: { id: true, name: true, username: true, image: true, stripeAccountId: true },
  });
  if (!user) notFound();

  const [storeRecord, recommendations] = await Promise.all([
    db.store.findUnique({ where: { userId: user.id } }).catch(() => null),
    db.product.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      take: 8,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, price: true, comparePrice: true, images: true, type: true, inventory: true },
    }).catch(() => []),
  ]);

  const storeSettings: StoreSettings = {
    ...DEFAULT_SETTINGS,
    ...(storeRecord ? {
      name: storeRecord.name,
      logoImage: storeRecord.logoImage,
      theme: storeRecord.theme,
      primaryColor: storeRecord.primaryColor,
      buttonStyle: storeRecord.buttonStyle,
      fontStyle: storeRecord.fontStyle,
      navStyle: storeRecord.navStyle,
      footerStyle: storeRecord.footerStyle,
      showFreeShippingBar: storeRecord.showFreeShippingBar ?? false,
      freeShippingThreshold: storeRecord.freeShippingThreshold ?? 50,
      freeShippingText: storeRecord.freeShippingText || "free shipping",
      localPickupOnly: storeRecord.localPickupOnly ?? false,
      localPickupNote: storeRecord.localPickupNote ?? null,
      cartCrossSell: storeRecord.cartCrossSell ?? false,
      featuredIds: Array.isArray(storeRecord.featuredIds) ? (storeRecord.featuredIds as string[]) : [],
      cartNote: storeRecord.cartNote ?? false,
      cartBehavior: (storeRecord.cartBehavior === "page" ? "page" : "drawer") as "drawer" | "page",
      baseCurrency: storeRecord.baseCurrency ?? "USD",
      enabledCurrencies: (Array.isArray(storeRecord.enabledCurrencies) ? storeRecord.enabledCurrencies : []) as string[],
      showCurrencySwitcher: storeRecord.showCurrencySwitcher ?? false,
    } : {}),
  };

  return (
    <CartClient
      user={{ name: user.name, username: user.username ?? username, image: user.image }}
      storeSettings={storeSettings}
      sellerHasPayments={!!user.stripeAccountId}
      recommendations={recommendations}
    />
  );
}
