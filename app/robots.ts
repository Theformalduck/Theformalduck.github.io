import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXTAUTH_URL ?? "https://sellora.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep the app shell and private/account areas out of search results.
      disallow: ["/api/", "/dashboard", "/settings", "/orders", "/wishlist", "/team", "/analytics", "/subscriptions"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
