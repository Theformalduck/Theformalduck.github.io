export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ProductsPageClient from "./products-client";
import { DEFAULT_SETTINGS, type StoreSettings } from "@/lib/store-themes";
import type { CustomButton } from "@/lib/store-themes";

export default async function StoreProductsPage(
  props: PageProps<"/[username]/store/products">
) {
  const { username } = await props.params;

  const user = await db.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      bio: true,
      products: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          comparePrice: true,
          type: true,
          images: true,
          inventory: true,
        },
      },
    },
  });

  if (!user) notFound();

  const [session, storeRecord] = await Promise.all([
    auth(),
    db.store.findUnique({ where: { userId: user.id } }).catch(() => null),
  ]);

  const isOwner = session?.user?.id === user.id;

  const storeSettings: StoreSettings = {
    ...DEFAULT_SETTINGS,
    ...(storeRecord ? {
      name: storeRecord.name,
      tagline: storeRecord.tagline,
      bannerImage: storeRecord.bannerImage,
      logoImage: storeRecord.logoImage,
      theme: storeRecord.theme,
      primaryColor: storeRecord.primaryColor,
      buttonStyle: storeRecord.buttonStyle,
      fontStyle: storeRecord.fontStyle,
      layout: storeRecord.layout,
      cardStyle: storeRecord.cardStyle,
      announcementText: storeRecord.announcementText,
      announcementColor: storeRecord.announcementColor,
      showRatings: storeRecord.showRatings,
      featuredIds: storeRecord.featuredIds,
      socialLinks: (storeRecord.socialLinks as Record<string, string>) ?? {},
      policies: (storeRecord.policies as Record<string, string>) ?? {},
      heroStyle: storeRecord.heroStyle,
      navStyle: storeRecord.navStyle,
      imageRatio: storeRecord.imageRatio,
      showProductCount: storeRecord.showProductCount,
      showFilters: storeRecord.showFilters,
      sectionTitle: storeRecord.sectionTitle,
      footerStyle: storeRecord.footerStyle,
      backgroundEffect: storeRecord.backgroundEffect,
      heroSize: storeRecord.heroSize,
      heroTextAlign: storeRecord.heroTextAlign,
      ctaText: storeRecord.ctaText,
      showNewsletter: storeRecord.showNewsletter,
      heroOverlay: storeRecord.heroOverlay,
      customButtons: (Array.isArray(storeRecord.customButtons) ? storeRecord.customButtons : []) as unknown as CustomButton[],
      collectionSections: (Array.isArray(storeRecord.collectionSections) ? storeRecord.collectionSections : []) as unknown as StoreSettings["collectionSections"],
      baseCurrency: storeRecord.baseCurrency ?? "USD",
      enabledCurrencies: (Array.isArray(storeRecord.enabledCurrencies) ? storeRecord.enabledCurrencies : []) as string[],
      showCurrencySwitcher: storeRecord.showCurrencySwitcher ?? false,
      cartBehavior: (storeRecord.cartBehavior === "page" ? "page" : "drawer") as "drawer" | "page",
    } : {}),
  };

  return (
    <Suspense>
      <ProductsPageClient
        user={{ name: user.name, username: user.username!, image: user.image }}
        storeSettings={storeSettings}
        products={user.products.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          comparePrice: p.comparePrice,
          type: p.type,
          images: p.images,
          inventory: p.inventory,
        }))}
        isOwner={isOwner}
      />
    </Suspense>
  );
}
