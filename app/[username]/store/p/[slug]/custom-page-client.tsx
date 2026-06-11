"use client";

import { StoreSections } from "../../store-sections";
import type { StoreSection } from "@/lib/store-sections";

type Theme = { bg: string; surface: string; surfaceHover: string; border: string; text: string; muted: string };
type Product = { id: string; name: string; price: number; images: string[] };

// Thin client wrapper so the section renderer gets a (non-serializable) currency
// formatter. Custom pages are content/showcase pages, product cards link to the
// product page rather than carrying the full cart UI.
export function CustomPageClient({ sections, theme, accent, accentText, products, username, btnRadius, currency }: {
  sections: StoreSection[];
  theme: Theme;
  accent: string;
  accentText: string;
  products: Product[];
  username: string;
  btnRadius: string;
  currency: string;
}) {
  const fmt = (n: number) => {
    try { return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n); }
    catch { return "$" + n.toFixed(2); }
  };
  return (
    <StoreSections
      sections={sections}
      theme={theme}
      accent={accent}
      accentText={accentText}
      products={products}
      username={username}
      formatCurrency={fmt}
      btnRadius={btnRadius}
    />
  );
}
