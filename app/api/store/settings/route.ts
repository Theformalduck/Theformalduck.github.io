import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isCurrency } from "@/lib/currencies";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const store = await db.store.findUnique({ where: { userId: session.user.id } });
    return NextResponse.json(store ?? {});
  } catch (err) {
    console.error("[store/settings GET]", err);
    return NextResponse.json({}, { status: 200 });
  }
}

// Build the Store column data object from a settings body. Shared by the
// settings save flow and the draft-publish flow.
export function buildStoreData(body: any) {
  const {
    name, tagline, bannerImage, logoImage,
    theme, primaryColor, buttonStyle, fontStyle, layout, carouselRows, carouselAutoplay, cardStyle,
    announcementText, announcementColor, showRatings,
    featuredIds, socialLinks, policies,
    heroStyle, navStyle, navHeight, imageRatio,
    showProductCount, showFilters, sectionTitle,
    footerStyle, backgroundEffect,
    heroSize, heroTextAlign, ctaText, heroHeading, heroSubheading, heroMarqueeText, heroItems, heroCtaPos, showNewsletter, heroOverlay, customButtons,
    elementPositions, storePages,
    stickyHeader, tickerEnabled, tickerText, tickerSpeed,
    showSaleBadge, showNewBadge, showQuickAdd, showProductType,
    showTrustBar, trustBadges,
    seoTitle, seoDescription, favicon, customCss, typographyScale,
    googleAnalyticsId, metaPixelId, customHeadCode, customBodyCode,
    // New settings
    showFreeShippingBar, freeShippingThreshold, freeShippingText, localPickupOnly, localPickupNote, cartNote, cartBehavior, lowStockThreshold,
    showShareButtons, showWishlist, showProductZoom,
    stockBadge, stockBadgeThreshold,
    showPaymentIcons,
    popupEnabled, popupTitle, popupDelay,
    testimonialsEnabled, testimonialItems,
    imageBannerEnabled, imageBannerHeading, imageBannerText,
    imageBannerImage, imageBannerCtaText, imageBannerLayout,
    iconRowEnabled, iconRowItems,
    homeSections, collectionSections, productSections, homeLayout, customPages,
    productGalleryStyle, productInfoLayout, showRelatedProducts, relatedProductsCount, stickyAddToCart,
    cartCrossSell, savedSections, showBuyNow, productTrustBadges,
    baseCurrency, enabledCurrencies, showCurrencySwitcher,
  } = body;

  const data = {
    ...(name !== undefined && { name }),
    ...(tagline !== undefined && { tagline }),
    ...(bannerImage !== undefined && { bannerImage }),
    ...(logoImage !== undefined && { logoImage }),
    ...(theme !== undefined && { theme }),
    ...(primaryColor !== undefined && { primaryColor }),
    ...(buttonStyle !== undefined && { buttonStyle }),
    ...(fontStyle !== undefined && { fontStyle }),
    ...(layout !== undefined && { layout }),
    ...(carouselRows !== undefined && { carouselRows }),
    ...(carouselAutoplay !== undefined && { carouselAutoplay }),
    ...(cardStyle !== undefined && { cardStyle }),
    ...(announcementText !== undefined && { announcementText }),
    ...(announcementColor !== undefined && { announcementColor }),
    ...(showRatings !== undefined && { showRatings }),
    ...(featuredIds !== undefined && { featuredIds }),
    ...(socialLinks !== undefined && { socialLinks }),
    ...(policies !== undefined && { policies }),
    ...(heroStyle !== undefined && { heroStyle }),
    ...(navStyle !== undefined && { navStyle }),
    ...(navHeight !== undefined && { navHeight }),
    ...(imageRatio !== undefined && { imageRatio }),
    ...(showProductCount !== undefined && { showProductCount }),
    ...(showFilters !== undefined && { showFilters }),
    ...(sectionTitle !== undefined && { sectionTitle }),
    ...(footerStyle !== undefined && { footerStyle }),
    ...(backgroundEffect !== undefined && { backgroundEffect }),
    ...(heroSize !== undefined && { heroSize }),
    ...(heroTextAlign !== undefined && { heroTextAlign }),
    ...(ctaText !== undefined && { ctaText }),
    ...(heroHeading !== undefined && { heroHeading: heroHeading || null }),
    ...(heroSubheading !== undefined && { heroSubheading: heroSubheading || null }),
    ...(heroMarqueeText !== undefined && { heroMarqueeText: heroMarqueeText || null }),
    ...(heroItems !== undefined && { heroItems }),
    ...(heroCtaPos !== undefined && { heroCtaPos }),
    ...(showNewsletter !== undefined && { showNewsletter }),
    ...(heroOverlay !== undefined && { heroOverlay }),
    ...(customButtons !== undefined && { customButtons }),
    ...(elementPositions !== undefined && { elementPositions }),
    ...(storePages !== undefined && { storePages }),
    ...(stickyHeader !== undefined && { stickyHeader }),
    ...(tickerEnabled !== undefined && { tickerEnabled }),
    ...(tickerText !== undefined && { tickerText }),
    ...(tickerSpeed !== undefined && { tickerSpeed }),
    ...(showSaleBadge !== undefined && { showSaleBadge }),
    ...(showNewBadge !== undefined && { showNewBadge }),
    ...(showQuickAdd !== undefined && { showQuickAdd }),
    ...(showProductType !== undefined && { showProductType }),
    ...(showTrustBar !== undefined && { showTrustBar }),
    ...(trustBadges !== undefined && { trustBadges }),
    ...(seoTitle !== undefined && { seoTitle }),
    ...(seoDescription !== undefined && { seoDescription }),
    ...(favicon !== undefined && { favicon }),
    ...(customCss !== undefined && { customCss }),
    ...(googleAnalyticsId !== undefined && { googleAnalyticsId: googleAnalyticsId || null }),
    ...(metaPixelId !== undefined && { metaPixelId: metaPixelId || null }),
    ...(customHeadCode !== undefined && { customHeadCode: customHeadCode || null }),
    ...(customBodyCode !== undefined && { customBodyCode: customBodyCode || null }),
    ...(typographyScale !== undefined && { typographyScale }),
    // New settings
    ...(showFreeShippingBar !== undefined && { showFreeShippingBar }),
    ...(freeShippingThreshold !== undefined && { freeShippingThreshold }),
    ...(freeShippingText !== undefined && { freeShippingText: String(freeShippingText).slice(0, 40) || "free shipping" }),
    ...(localPickupOnly !== undefined && { localPickupOnly: !!localPickupOnly }),
    ...(localPickupNote !== undefined && { localPickupNote: localPickupNote ? String(localPickupNote).slice(0, 300) : null }),
    ...(cartNote !== undefined && { cartNote }),
    ...(cartBehavior !== undefined && { cartBehavior: cartBehavior === "page" ? "page" : "drawer" }),
    ...(lowStockThreshold !== undefined && { lowStockThreshold: Math.max(0, Math.min(1000, Math.floor(Number(lowStockThreshold) || 0))) }),
    ...(showShareButtons !== undefined && { showShareButtons }),
    ...(showWishlist !== undefined && { showWishlist }),
    ...(showProductZoom !== undefined && { showProductZoom }),
    ...(stockBadge !== undefined && { stockBadge }),
    ...(stockBadgeThreshold !== undefined && { stockBadgeThreshold }),
    ...(showPaymentIcons !== undefined && { showPaymentIcons }),
    ...(popupEnabled !== undefined && { popupEnabled }),
    ...(popupTitle !== undefined && { popupTitle }),
    ...(popupDelay !== undefined && { popupDelay }),
    ...(testimonialsEnabled !== undefined && { testimonialsEnabled }),
    ...(testimonialItems !== undefined && { testimonialItems }),
    ...(imageBannerEnabled !== undefined && { imageBannerEnabled }),
    ...(imageBannerHeading !== undefined && { imageBannerHeading }),
    ...(imageBannerText !== undefined && { imageBannerText }),
    ...(imageBannerImage !== undefined && { imageBannerImage }),
    ...(imageBannerCtaText !== undefined && { imageBannerCtaText }),
    ...(imageBannerLayout !== undefined && { imageBannerLayout }),
    ...(iconRowEnabled !== undefined && { iconRowEnabled }),
    ...(iconRowItems !== undefined && { iconRowItems }),
    ...(homeSections !== undefined && { homeSections }),
    ...(collectionSections !== undefined && { collectionSections }),
    ...(productSections !== undefined && { productSections }),
    ...(homeLayout !== undefined && { homeLayout }),
    ...(customPages !== undefined && { customPages }),
    ...(productGalleryStyle !== undefined && { productGalleryStyle }),
    ...(productInfoLayout !== undefined && { productInfoLayout }),
    ...(showRelatedProducts !== undefined && { showRelatedProducts }),
    ...(relatedProductsCount !== undefined && { relatedProductsCount }),
    ...(stickyAddToCart !== undefined && { stickyAddToCart: !!stickyAddToCart }),
    ...(cartCrossSell !== undefined && { cartCrossSell: !!cartCrossSell }),
    ...(savedSections !== undefined && { savedSections: Array.isArray(savedSections) ? savedSections : [] }),
    ...(showBuyNow !== undefined && { showBuyNow: !!showBuyNow }),
    ...(productTrustBadges !== undefined && { productTrustBadges: !!productTrustBadges }),
    ...(baseCurrency !== undefined && isCurrency(baseCurrency) && { baseCurrency }),
    ...(enabledCurrencies !== undefined && {
      enabledCurrencies: Array.isArray(enabledCurrencies)
        ? [...new Set(enabledCurrencies.filter(isCurrency))]
        : [],
    }),
    ...(showCurrencySwitcher !== undefined && { showCurrencySwitcher: !!showCurrencySwitcher }),
  };
  return data;
}

async function saveSettings(req: NextRequest, userId: string) {
  const body = await req.json();
  const data = buildStoreData(body);

  const store = await db.store.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });

  const userRecord = await db.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });
  if (userRecord?.username) {
    revalidatePath(`/${userRecord.username}/store`);
    revalidatePath(`/${userRecord.username}/store/products`);
  }

  return store;
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const store = await saveSettings(req, session.user.id);
    return NextResponse.json(store);
  } catch (err) {
    console.error("[store/settings PUT]", err);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  console.log("[store/settings PATCH] handler reached");
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const store = await saveSettings(req, session.user.id);
    console.log("[store/settings PATCH] success");
    return NextResponse.json(store);
  } catch (err: any) {
    const msg = String(err?.message ?? err ?? "Unknown error");
    console.error("[store/settings PATCH] error:", err?.constructor?.name, "\n", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
