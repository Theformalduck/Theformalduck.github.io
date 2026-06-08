export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { STORE_THEMES, BUTTON_STYLES, DEFAULT_SETTINGS } from "@/lib/store-themes";
import type { CustomPage } from "@/lib/store-sections";
import { CustomPageClient } from "./custom-page-client";

// Pick a readable text colour (dark or white) for a given background.
function readableOn(hex: string): string {
  const h = (hex || "#000000").replace("#", "");
  const f = h.length === 3 ? h.split("").map((x) => x + x).join("") : h.padEnd(6, "0");
  const r = parseInt(f.slice(0, 2), 16) || 0, g = parseInt(f.slice(2, 4), 16) || 0, b = parseInt(f.slice(4, 6), 16) || 0;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#111827" : "#ffffff";
}

export async function generateMetadata(
  { params }: { params: Promise<{ username: string; slug: string }> }
): Promise<Metadata> {
  const { username, slug } = await params;
  const user = await db.user.findUnique({ where: { username }, select: { store: { select: { customPages: true, name: true } } } });
  const pages = (user?.store?.customPages as CustomPage[] | undefined) ?? [];
  const page = pages.find((p) => p.slug === slug);
  if (!page) return {};
  return { title: `${page.title} · ${user?.store?.name ?? username}` };
}

export default async function CustomStorePage(
  { params }: { params: Promise<{ username: string; slug: string }> }
) {
  const { username, slug } = await params;

  const user = await db.user.findUnique({
    where: { username },
    select: {
      id: true, name: true, username: true,
      products: {
        where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" }, take: 12,
        select: { id: true, name: true, price: true, images: true },
      },
    },
  });
  if (!user) notFound();

  const storeRecord = await db.store.findUnique({ where: { userId: user.id } }).catch(() => null);
  const pages = (storeRecord?.customPages as CustomPage[] | undefined) ?? [];
  const page = pages.find((p) => p.slug === slug);
  if (!page) notFound();

  const theme = STORE_THEMES[storeRecord?.theme ?? DEFAULT_SETTINGS.theme] ?? STORE_THEMES.default;
  const btnStyle = BUTTON_STYLES[storeRecord?.buttonStyle ?? DEFAULT_SETTINGS.buttonStyle] ?? BUTTON_STYLES.rounded;
  const accent = storeRecord?.primaryColor ?? DEFAULT_SETTINGS.primaryColor;
  const storeName = storeRecord?.name ?? user.name ?? username;
  const logoImage = storeRecord?.logoImage ?? null;
  const currency = storeRecord?.baseCurrency ?? "USD";

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text, minHeight: "100vh" }}>
      <header className="sticky top-0 z-40 border-b" style={{ background: theme.navBg, borderColor: theme.border }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href={`/${username}/store`} className="flex items-center gap-2.5">
            {logoImage
              ? <img src={logoImage} alt={storeName} className="h-7 w-auto object-contain" />
              : <span className="text-base font-semibold tracking-tight" style={{ color: theme.text }}>{storeName}</span>}
          </Link>
          <Link href={`/${username}/store`} className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: theme.muted }}>
            ← Back to store
          </Link>
        </div>
      </header>

      <main>
        <div className="max-w-6xl mx-auto px-6 pt-12 pb-1">
          <h1 className="font-black text-3xl sm:text-4xl" style={{ color: theme.text }}>{page.title}</h1>
        </div>
        {(page.sections?.length ?? 0) > 0 ? (
          <CustomPageClient
            sections={page.sections}
            theme={theme}
            accent={accent}
            accentText={readableOn(accent)}
            products={user.products}
            username={user.username!}
            btnRadius={btnStyle.radius}
            currency={currency}
          />
        ) : (
          <div className="max-w-6xl mx-auto px-6 py-16">
            <p className="text-sm italic" style={{ color: theme.muted }}>This page has no content yet.</p>
          </div>
        )}
      </main>

      <footer className="border-t mt-8" style={{ borderColor: theme.border }}>
        <div className="max-w-6xl mx-auto px-6 py-6">
          <Link href={`/${username}/store`} className={`text-sm font-medium px-4 py-2 border transition-opacity hover:opacity-70 ${btnStyle.radius}`} style={{ borderColor: theme.border, color: theme.muted, background: theme.surface }}>
            ← Shop
          </Link>
        </div>
      </footer>
    </div>
  );
}
