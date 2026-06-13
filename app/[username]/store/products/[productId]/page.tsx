export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DEFAULT_SETTINGS, type StoreSettings } from "@/lib/store-themes";
import { JsonLd } from "@/components/seo/json-ld";
import ProductDetailClient from "./product-detail-client";

export async function generateMetadata(props: PageProps<"/[username]/store/products/[productId]">): Promise<Metadata> {
  const { username, productId } = await props.params;
  const data = await db.user.findUnique({
    where: { username },
    select: {
      name: true,
      products: {
        where: { id: productId, status: "ACTIVE" },
        take: 1,
        select: { name: true, description: true, images: true, price: true },
      },
    },
  });
  if (!data) return {};
  const product = data.products[0];
  if (!product) return {};
  const title = `${product.name} – ${data.name ?? username}`;
  const description = product.description ?? `Buy ${product.name} from ${data.name ?? username}`;
  const appUrl = process.env.NEXTAUTH_URL ?? "";
  return {
    title,
    description,
    openGraph: {
      title, description,
      url: `${appUrl}/${username}/store/products/${productId}`,
      type: "website",
      ...(product.images[0] ? { images: [{ url: product.images[0] }] } : {}),
    },
    twitter: {
      card: product.images[0] ? "summary_large_image" : "summary",
      title, description,
      ...(product.images[0] ? { images: [product.images[0]] } : {}),
    },
  };
}

export default async function ProductDetailPage(
  props: PageProps<"/[username]/store/products/[productId]">
) {
  const { username, productId } = await props.params;

  const user = await db.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      stripeAccountId: true,
      products: {
        where: { id: productId, status: "ACTIVE" },
        take: 1,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          comparePrice: true,
          type: true,
          images: true,
          inventory: true,
          metafields: true,
          variants: {
            orderBy: { id: "asc" },
            select: { id: true, optionType: true, name: true, colorHex: true, image: true, price: true, inventory: true },
          },
          reviews: {
            include: { author: { select: { id: true, name: true, image: true, username: true } } },
            orderBy: { createdAt: "desc" as const },
          },
        },
      },
    },
  });

  if (!user) notFound();
  const product = user.products[0];
  if (!product) notFound();

  const reviewerIds = [...new Set(product.reviews.map(r => r.authorId))];
  const [session, storeRecord, relatedProducts, purchasedItems] = await Promise.all([
    auth(),
    db.store.findUnique({ where: { userId: user.id } }).catch(() => null),
    db.product.findMany({
      where: { userId: user.id, status: "ACTIVE", NOT: { id: productId } },
      take: 4,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, price: true, comparePrice: true, images: true, type: true },
    }),
    // Who among the reviewers actually bought this product (verified-purchase badge)
    reviewerIds.length
      ? db.orderItem.findMany({
          where: { productId, order: { buyerId: { in: reviewerIds } } },
          select: { order: { select: { buyerId: true } } },
        }).catch(() => [])
      : Promise.resolve([]),
  ]);
  const purchasedReviewerIds = new Set(purchasedItems.map(i => i.order?.buyerId).filter(Boolean));

  const isOwner = session?.user?.id === user.id;

  const storeSettings: StoreSettings = {
    ...DEFAULT_SETTINGS,
    ...(storeRecord ? {
      name: storeRecord.name,
      theme: storeRecord.theme,
      primaryColor: storeRecord.primaryColor,
      buttonStyle: storeRecord.buttonStyle,
      fontStyle: storeRecord.fontStyle,
      cardStyle: storeRecord.cardStyle,
      logoImage: storeRecord.logoImage,
      customButtons: (Array.isArray(storeRecord.customButtons) ? storeRecord.customButtons : []) as unknown as import("@/lib/store-themes").CustomButton[],
      policies: (storeRecord.policies as Record<string, string>) ?? {},
      socialLinks: (storeRecord.socialLinks as Record<string, string>) ?? {},
      productGalleryStyle: (storeRecord.productGalleryStyle ?? "thumbnails") as StoreSettings["productGalleryStyle"],
      productInfoLayout: (storeRecord.productInfoLayout ?? "accordion") as StoreSettings["productInfoLayout"],
      showRelatedProducts: storeRecord.showRelatedProducts ?? true,
      relatedProductsCount: storeRecord.relatedProductsCount ?? 4,
      stickyAddToCart: storeRecord.stickyAddToCart ?? false,
      showProductZoom: storeRecord.showProductZoom ?? true,
      showShareButtons: storeRecord.showShareButtons ?? true,
      showWishlist: storeRecord.showWishlist ?? false,
      stockBadge: storeRecord.stockBadge ?? true,
      stockBadgeThreshold: storeRecord.stockBadgeThreshold ?? 5,
      showRatings: storeRecord.showRatings ?? true,
      showBuyNow: storeRecord.showBuyNow ?? true,
      productTrustBadges: storeRecord.productTrustBadges ?? true,
      productSections: (Array.isArray(storeRecord.productSections) ? storeRecord.productSections : []) as unknown as StoreSettings["productSections"],
      baseCurrency: storeRecord.baseCurrency ?? "USD",
      enabledCurrencies: (Array.isArray(storeRecord.enabledCurrencies) ? storeRecord.enabledCurrencies : []) as string[],
      showCurrencySwitcher: storeRecord.showCurrencySwitcher ?? false,
    } : {}),
  };

  // ── Structured data (rich snippets) ──────────────────────────────────────────
  const appUrl = process.env.NEXTAUTH_URL ?? "";
  const productUrl = `${appUrl}/${username}/store/products/${product.id}`;
  const ratings = product.reviews.map(r => (r as any).rating).filter((n: unknown): n is number => typeof n === "number" && n > 0);
  const avgRating = ratings.length ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : null;
  const inStock = product.inventory === null || product.inventory > 0;

  const productJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(product.description ? { description: product.description } : {}),
    ...(product.images?.length ? { image: product.images } : {}),
    sku: product.id,
    brand: { "@type": "Brand", name: storeRecord?.name ?? user.name ?? username },
    offers: {
      "@type": "Offer",
      price: product.price.toFixed(2),
      priceCurrency: "USD",
      availability: `https://schema.org/${inStock ? "InStock" : "OutOfStock"}`,
      url: productUrl,
      ...(product.comparePrice && product.comparePrice > product.price ? { priceValidUntil: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10) } : {}),
    },
    ...(avgRating && ratings.length
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: avgRating.toFixed(1), reviewCount: ratings.length } }
      : {}),
  };

  const breadcrumbJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: storeRecord?.name ?? "Store", item: `${appUrl}/${username}/store` },
      { "@type": "ListItem", position: 2, name: "Products", item: `${appUrl}/${username}/store/products` },
      { "@type": "ListItem", position: 3, name: product.name, item: productUrl },
    ],
  };

  return (
    <>
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <ProductDetailClient
        user={{ name: user.name, username: user.username ?? "", image: user.image }}
        product={{
          ...product,
          reviews: product.reviews.map(r => ({
            ...r,
            createdAt: r.createdAt.toISOString(),
            sellerRepliedAt: r.sellerRepliedAt ? r.sellerRepliedAt.toISOString() : null,
            verified: purchasedReviewerIds.has(r.authorId),
          })),
        }}
        relatedProducts={relatedProducts}
        storeSettings={storeSettings}
        isOwner={isOwner}
        sellerHasPayments={!!user.stripeAccountId}
        currentUserId={session?.user?.id ?? null}
      />
    </>
  );
}
