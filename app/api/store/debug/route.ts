import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Tests each field group independently to find which one causes the Prisma error
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ auth: false, error: "No session" }, { status: 401 });
  }

  const uid = session.user.id;
  const results: Record<string, string> = {};

  const groups: Array<[string, Record<string, unknown>]> = [
    ["strings", { name: null, tagline: null, theme: "default", primaryColor: "#29abe2", buttonStyle: "rounded", fontStyle: "modern", layout: "grid", cardStyle: "shadow", heroStyle: "storefront", navStyle: "default", imageRatio: "square", footerStyle: "standard", backgroundEffect: "none", heroSize: "large", heroTextAlign: "left", typographyScale: "normal", tickerSpeed: "normal" }],
    ["nullableStrings", { announcementText: null, sectionTitle: null, bannerImage: null, logoImage: null, ctaText: null, tickerText: null, seoTitle: null, seoDescription: null, favicon: null, customCss: null, popupTitle: null, imageBannerHeading: null, imageBannerText: null, imageBannerImage: null, imageBannerCtaText: null, imageBannerLayout: "left" }],
    ["booleans", { showRatings: true, showProductCount: true, showFilters: true, showNewsletter: false, stickyHeader: true, tickerEnabled: false, showSaleBadge: true, showNewBadge: false, showQuickAdd: true, showProductType: true, showTrustBar: true, showFreeShippingBar: false, cartNote: false, showShareButtons: true, showWishlist: false, showProductZoom: true, stockBadge: true, showPaymentIcons: true, popupEnabled: false, testimonialsEnabled: false, imageBannerEnabled: false, iconRowEnabled: false }],
    ["numbers", { heroOverlay: 50, popupDelay: 5, stockBadgeThreshold: 5, freeShippingThreshold: 50 }],
    ["stringArrays", { featuredIds: [] }],
    ["jsonObjects", { socialLinks: {}, policies: {}, elementPositions: {}, storePages: {} }],
    ["jsonArrays", { customButtons: [], trustBadges: [], testimonialItems: [], iconRowItems: [] }],
  ];

  for (const [group, data] of groups) {
    try {
      await db.store.upsert({ where: { userId: uid }, create: { userId: uid, ...data }, update: data });
      results[group] = "OK";
    } catch (err: any) {
      results[group] = err?.message ?? String(err);
    }
  }

  return NextResponse.json({ results });
}
