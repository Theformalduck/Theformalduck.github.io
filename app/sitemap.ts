import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const siteUrl = process.env.NEXTAUTH_URL ?? "https://sellora.app";

export const revalidate = 3600; // refresh hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    "", "/discover", "/login", "/signup", "/terms", "/privacy", "/cookies",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "monthly",
    priority: path === "" ? 1 : 0.6,
  }));

  // Public creator pages: published portfolios + their stores.
  let creatorRoutes: MetadataRoute.Sitemap = [];
  try {
    const creators = await db.user.findMany({
      where: { username: { not: null }, portfolio: { published: true } },
      select: { username: true, updatedAt: true },
      take: 5000,
    });
    creatorRoutes = creators.flatMap((c) => [
      { url: `${siteUrl}/${c.username}`, lastModified: c.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 },
      { url: `${siteUrl}/${c.username}/store`, lastModified: c.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 },
    ]);
  } catch (err) {
    console.error("[sitemap] creator query failed:", err);
  }

  return [...staticRoutes, ...creatorRoutes];
}
