export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import StoreClient from "./store-client";
import { DEFAULT_SETTINGS, type StoreSettings } from "@/lib/store-themes";
import { JsonLd } from "@/components/seo/json-ld";

export async function generateMetadata(props: PageProps<"/[username]/store">): Promise<Metadata> {
  const { username } = await props.params;
  const user = await db.user.findUnique({
    where: { username },
    select: { name: true, store: { select: { seoTitle: true, seoDescription: true, name: true, tagline: true, favicon: true } } },
  });
  if (!user) return {};
  const store = user.store;
  const title = store?.seoTitle ?? store?.name ?? `${user.name ?? username}'s Store`;
  const description = store?.seoDescription ?? store?.tagline ?? `Shop products from ${user.name ?? username}`;
  const appUrl = process.env.NEXTAUTH_URL ?? "";
  return {
    title,
    description,
    openGraph: { title, description, url: `${appUrl}/${username}/store`, type: "website" },
    twitter: { card: "summary", title, description },
    ...(store?.favicon ? { icons: { icon: store.favicon } } : {}),
  };
}

export default async function PublicStorePage(
  props: PageProps<"/[username]/store">
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
      stripeAccountId: true,
      portfolio: {
        select: {
          published: true,
          primaryColor: true,
        },
      },
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
          variants: { select: { id: true, optionType: true, name: true, colorHex: true, price: true, inventory: true }, orderBy: { id: "asc" } },
        },
      },
    },
  });

  if (!user) notFound();

  const [session, storeRecord, collectionRecords] = await Promise.all([
    auth(),
    db.store.findUnique({ where: { userId: user.id } }).catch(() => null),
    db.collection.findMany({
      where: { userId: user.id, products: { some: { status: "ACTIVE" } } },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: { name: true, slug: true },
    }).catch(() => []),
  ]);

  const isOwner = session?.user?.id === user.id;
  const collections = collectionRecords.map(c => ({ name: c.name, slug: c.slug }));

  // Buyer's saved items (for heart state on product cards)
  let initialWishlist: string[] = [];
  if (session?.user?.id) {
    const me = await db.user.findUnique({ where: { id: session.user.id }, select: { wishlist: { select: { id: true } } } }).catch(() => null);
    initialWishlist = (me?.wishlist ?? []).map(p => p.id);
  }

  // Draft preview: owners can preview unpublished changes with ?preview=1
  const sp = await props.searchParams;
  const isPreview = !!(
    isOwner && sp?.preview === "1" &&
    storeRecord?.draftSettings && typeof storeRecord.draftSettings === "object"
  );

  const storeSettings: StoreSettings = isPreview
    ? { ...DEFAULT_SETTINGS, ...(storeRecord!.draftSettings as object) }
    : {
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
      carouselRows: storeRecord.carouselRows ?? 1,
      carouselAutoplay: storeRecord.carouselAutoplay ?? false,
      cardStyle: storeRecord.cardStyle,
      announcementText: storeRecord.announcementText,
      announcementColor: storeRecord.announcementColor,
      showRatings: storeRecord.showRatings,
      featuredIds: storeRecord.featuredIds,
      socialLinks: (storeRecord.socialLinks as Record<string, string>) ?? {},
      policies: (storeRecord.policies as Record<string, string>) ?? {},
      heroStyle: storeRecord.heroStyle,
      heroHeading: storeRecord.heroHeading ?? null,
      heroSubheading: storeRecord.heroSubheading ?? null,
      heroMarqueeText: storeRecord.heroMarqueeText ?? null,
      heroItems: (Array.isArray(storeRecord.heroItems) ? storeRecord.heroItems : []) as unknown as import("@/lib/store-themes").HeroItem[],
      heroCtaPos: storeRecord.heroCtaPos ?? "top-right",
      navStyle: storeRecord.navStyle,
      navHeight: storeRecord.navHeight ?? "default",
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
      customButtons: (Array.isArray(storeRecord.customButtons) ? storeRecord.customButtons : []) as unknown as import("@/lib/store-themes").CustomButton[],
      elementPositions: (storeRecord.elementPositions as Record<string, { x: number; y: number }>) ?? {},
      storePages: (storeRecord.storePages as StoreSettings["storePages"]) ?? {},
      stickyHeader: storeRecord.stickyHeader ?? true,
      tickerEnabled: storeRecord.tickerEnabled ?? false,
      tickerText: storeRecord.tickerText ?? null,
      tickerSpeed: storeRecord.tickerSpeed ?? "normal",
      showSaleBadge: storeRecord.showSaleBadge ?? true,
      showNewBadge: storeRecord.showNewBadge ?? false,
      showQuickAdd: storeRecord.showQuickAdd ?? true,
      showProductType: storeRecord.showProductType ?? true,
      showTrustBar: storeRecord.showTrustBar ?? true,
      trustBadges: (Array.isArray(storeRecord.trustBadges) ? storeRecord.trustBadges : []) as string[],
      seoTitle: storeRecord.seoTitle ?? null,
      seoDescription: storeRecord.seoDescription ?? null,
      favicon: storeRecord.favicon ?? null,
      customCss: storeRecord.customCss ?? null,
      googleAnalyticsId: storeRecord.googleAnalyticsId ?? null,
      metaPixelId: storeRecord.metaPixelId ?? null,
      customHeadCode: storeRecord.customHeadCode ?? null,
      customBodyCode: storeRecord.customBodyCode ?? null,
      typographyScale: storeRecord.typographyScale ?? "normal",
      showFreeShippingBar: storeRecord.showFreeShippingBar ?? false,
      freeShippingThreshold: storeRecord.freeShippingThreshold ?? 50,
      cartNote: storeRecord.cartNote ?? false,
      cartBehavior: (storeRecord.cartBehavior === "page" ? "page" : "drawer") as "drawer" | "page",
      showShareButtons: storeRecord.showShareButtons ?? true,
      showWishlist: storeRecord.showWishlist ?? false,
      showProductZoom: storeRecord.showProductZoom ?? true,
      stockBadge: storeRecord.stockBadge ?? true,
      stockBadgeThreshold: storeRecord.stockBadgeThreshold ?? 5,
      showPaymentIcons: storeRecord.showPaymentIcons ?? true,
      popupEnabled: storeRecord.popupEnabled ?? false,
      popupTitle: storeRecord.popupTitle ?? null,
      popupDelay: storeRecord.popupDelay ?? 5,
      testimonialsEnabled: storeRecord.testimonialsEnabled ?? false,
      testimonialItems: (Array.isArray(storeRecord.testimonialItems) ? storeRecord.testimonialItems : []) as StoreSettings["testimonialItems"],
      imageBannerEnabled: storeRecord.imageBannerEnabled ?? false,
      imageBannerHeading: storeRecord.imageBannerHeading ?? null,
      imageBannerText: storeRecord.imageBannerText ?? null,
      imageBannerImage: storeRecord.imageBannerImage ?? null,
      imageBannerCtaText: storeRecord.imageBannerCtaText ?? null,
      imageBannerLayout: (storeRecord.imageBannerLayout ?? "left") as "left" | "right",
      iconRowEnabled: storeRecord.iconRowEnabled ?? false,
      iconRowItems: (Array.isArray(storeRecord.iconRowItems) ? storeRecord.iconRowItems : []) as StoreSettings["iconRowItems"],
      homeSections: (Array.isArray(storeRecord.homeSections) ? storeRecord.homeSections : []) as unknown as StoreSettings["homeSections"],
      homeLayout: (Array.isArray(storeRecord.homeLayout) ? storeRecord.homeLayout : []) as unknown as StoreSettings["homeLayout"],
      customPages: (Array.isArray(storeRecord.customPages) ? storeRecord.customPages : []) as unknown as StoreSettings["customPages"],
      baseCurrency: storeRecord.baseCurrency ?? "USD",
      enabledCurrencies: (Array.isArray(storeRecord.enabledCurrencies) ? storeRecord.enabledCurrencies : []) as string[],
      showCurrencySwitcher: storeRecord.showCurrencySwitcher ?? false,
    } : {
      primaryColor: user.portfolio?.primaryColor ?? "#29abe2",
    }),
  };

  const appUrl = process.env.NEXTAUTH_URL ?? "";
  const socialLinks = (storeRecord?.socialLinks as Record<string, string> | undefined) ?? {};
  const storeJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: storeRecord?.name ?? user.name ?? username,
    ...(storeRecord?.tagline ? { description: storeRecord.tagline } : {}),
    url: `${appUrl}/${username}/store`,
    ...(storeRecord?.logoImage || user.image ? { logo: storeRecord?.logoImage ?? user.image } : {}),
    ...(storeRecord?.bannerImage ? { image: storeRecord.bannerImage } : {}),
    ...(Object.values(socialLinks).filter(Boolean).length ? { sameAs: Object.values(socialLinks).filter(Boolean) } : {}),
  };

  return (
    <Suspense>
      <JsonLd data={storeJsonLd} />
      <StoreClient
        user={{
          name: user.name,
          username: user.username!,
          image: user.image,
          bio: user.bio,
        }}
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
        sellerHasPayments={!!user.stripeAccountId}
        isPreview={isPreview}
        collections={collections}
        currentUserId={session?.user?.id ?? null}
        initialWishlist={initialWishlist}
      />
    </Suspense>
  );
}
