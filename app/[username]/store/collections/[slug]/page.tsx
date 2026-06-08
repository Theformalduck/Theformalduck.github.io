export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import ProductsPageClient from "../../products/products-client";
import { DEFAULT_SETTINGS, type StoreSettings } from "@/lib/store-themes";
import type { CustomButton } from "@/lib/store-themes";

export async function generateMetadata(props: PageProps<"/[username]/store/collections/[slug]">): Promise<Metadata> {
  const { username, slug } = await props.params;
  const user = await db.user.findUnique({ where: { username }, select: { id: true, name: true } });
  if (!user) return {};
  const collection = await db.collection.findFirst({ where: { userId: user.id, slug }, select: { name: true, description: true, image: true } });
  if (!collection) return {};
  const title = `${collection.name} — ${user.name ?? username}`;
  const description = collection.description ?? `Shop the ${collection.name} collection.`;
  return {
    title, description,
    openGraph: { title, description, ...(collection.image ? { images: [{ url: collection.image }] } : {}) },
  };
}

export default async function CollectionPage(props: PageProps<"/[username]/store/collections/[slug]">) {
  const { username, slug } = await props.params;

  const user = await db.user.findUnique({
    where: { username },
    select: { id: true, name: true, username: true, image: true, bio: true },
  });
  if (!user) notFound();

  const [session, storeRecord, collection] = await Promise.all([
    auth(),
    db.store.findUnique({ where: { userId: user.id } }).catch(() => null),
    db.collection.findFirst({
      where: { userId: user.id, slug },
      include: {
        products: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          select: { id: true, name: true, description: true, price: true, comparePrice: true, type: true, images: true, inventory: true },
        },
      },
    }),
  ]);

  if (!collection) notFound();
  const isOwner = session?.user?.id === user.id;

  const storeSettings: StoreSettings = {
    ...DEFAULT_SETTINGS,
    ...(storeRecord ? {
      name: storeRecord.name,
      tagline: storeRecord.tagline,
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
      navStyle: storeRecord.navStyle,
      imageRatio: storeRecord.imageRatio,
      showProductCount: storeRecord.showProductCount,
      showFilters: storeRecord.showFilters,
      footerStyle: storeRecord.footerStyle,
      backgroundEffect: storeRecord.backgroundEffect,
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
        user={{ name: user.name, username: user.username ?? username, image: user.image }}
        storeSettings={storeSettings}
        products={collection.products}
        isOwner={isOwner}
        pageTitle={collection.name}
        pageDescription={collection.description}
        pageImage={collection.image}
      />
    </Suspense>
  );
}
