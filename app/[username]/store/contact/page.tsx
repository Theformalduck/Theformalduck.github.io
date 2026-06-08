export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { STORE_THEMES, BUTTON_STYLES, DEFAULT_SETTINGS } from "@/lib/store-themes";
import type { StoreSettings } from "@/lib/store-themes";

const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  twitter: "X / Twitter",
  tiktok: "TikTok",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  website: "Website",
};

export default async function StoreContactPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const user = await db.user.findUnique({
    where: { username },
    select: { id: true, name: true, username: true, image: true },
  });
  if (!user) notFound();

  const storeRecord = await db.store.findUnique({ where: { userId: user.id } }).catch(() => null);

  const theme      = STORE_THEMES[(storeRecord?.theme ?? DEFAULT_SETTINGS.theme)] ?? STORE_THEMES.default;
  const btnStyle   = BUTTON_STYLES[(storeRecord?.buttonStyle ?? DEFAULT_SETTINGS.buttonStyle)] ?? BUTTON_STYLES.rounded;
  const accent     = storeRecord?.primaryColor ?? DEFAULT_SETTINGS.primaryColor;
  const storeName  = storeRecord?.name ?? user.name ?? username;
  const logoImage  = storeRecord?.logoImage ?? null;

  const storePages   = (storeRecord?.storePages as StoreSettings["storePages"]) ?? {};
  const pageData     = storePages?.contact;
  const pageTitle    = pageData?.title ?? "Contact";
  const pageContent  = pageData?.content ?? "";

  const socialLinks  = (storeRecord?.socialLinks as Record<string, string>) ?? {};
  const activeSocials = Object.entries(socialLinks).filter(([, v]) => v);

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text, minHeight: "100vh" }}>
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b" style={{ background: theme.navBg, borderColor: theme.border }}>
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href={`/${username}/store`} className="flex items-center gap-2.5">
            {logoImage
              ? <img src={logoImage} alt={storeName} className="h-7 w-auto object-contain" />
              : <span className="text-base font-semibold tracking-tight" style={{ color: theme.text }}>{storeName}</span>
            }
          </Link>
          <Link href={`/${username}/store`}
            className="text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: theme.muted }}>
            ← Back to store
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="font-black text-4xl mb-8" style={{ color: theme.text }}>{pageTitle}</h1>

        {pageContent && (
          <div className="text-base leading-relaxed whitespace-pre-wrap max-w-2xl mb-10" style={{ color: theme.muted }}>
            {pageContent}
          </div>
        )}

        {activeSocials.length > 0 && (
          <div className="space-y-3 max-w-md">
            {activeSocials.map(([platform, url]) => (
              <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                className={`flex items-center justify-between w-full px-5 py-3.5 border transition-all hover:opacity-80 ${btnStyle.radius}`}
                style={{ background: theme.surface, borderColor: theme.border }}>
                <span className="text-sm font-semibold" style={{ color: theme.text }}>
                  {SOCIAL_LABELS[platform] ?? platform}
                </span>
                <span className="text-xs" style={{ color: theme.muted }}>→</span>
              </a>
            ))}
          </div>
        )}

        {!pageContent && activeSocials.length === 0 && (
          <p className="text-sm italic" style={{ color: theme.muted }}>
            No contact information has been added yet.
          </p>
        )}
      </main>

      <footer className="border-t mt-16" style={{ borderColor: theme.border }}>
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href={`/${username}/store`}
            className={`text-sm font-medium px-4 py-2 border transition-opacity hover:opacity-70 ${btnStyle.radius}`}
            style={{ borderColor: theme.border, color: theme.muted, background: theme.surface }}>
            ← Shop
          </Link>
          <Link href={`/${username}/store/faq`}
            className="text-sm font-medium hover:opacity-70 transition-opacity"
            style={{ color: accent }}>
            FAQ →
          </Link>
        </div>
      </footer>
    </div>
  );
}
