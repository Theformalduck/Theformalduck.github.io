import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://folio.ai";

export async function generateMetadata(
  { params }: { params: Promise<{ subdomain: string }> }
): Promise<Metadata> {
  const { subdomain } = await params;

  const row = await prisma.portfolio.findFirst({
    where: { subdomain, published: true },
    select: { data: true },
  });

  if (!row) {
    return { title: "Portfolio | Folio.ai" };
  }

  let name = "";
  let title = "";
  let bio = "";
  try {
    const d = JSON.parse(row.data);
    name  = d.name  ?? "";
    title = d.title ?? "";
    bio   = d.bio   ?? "";
  } catch {
    // ignore
  }

  const pageTitle       = name  ? `${name} — ${title || "Portfolio"}` : "Portfolio | Folio.ai";
  const description     = bio   ? bio.slice(0, 155) : `${name}'s professional portfolio, built with Folio.ai`;
  const canonicalUrl    = `${APP_URL}/p/${subdomain}`;

  return {
    title:       pageTitle,
    description,
    alternates:  { canonical: canonicalUrl },
    openGraph: {
      title:       pageTitle,
      description,
      url:         canonicalUrl,
      siteName:    "Folio.ai",
      type:        "profile",
    },
    twitter: {
      card:        "summary",
      title:       pageTitle,
      description,
    },
  };
}

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
