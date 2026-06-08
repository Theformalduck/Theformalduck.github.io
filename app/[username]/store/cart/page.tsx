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

  const storeRecord = await db.store.findUnique({ where: { userId: user.id } }).catch(() => null);

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
    />
  );
}
