export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { STORE_THEMES, BUTTON_STYLES, DEFAULT_SETTINGS } from "@/lib/store-themes";
import type { StoreSettings } from "@/lib/store-themes";

export default async function StoreFaqPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const user = await db.user.findUnique({
    where: { username },
    select: { id: true, name: true, username: true },
  });
  if (!user) notFound();

  const storeRecord = await db.store.findUnique({ where: { userId: user.id } }).catch(() => null);

  const theme     = STORE_THEMES[(storeRecord?.theme ?? DEFAULT_SETTINGS.theme)] ?? STORE_THEMES.default;
  const btnStyle  = BUTTON_STYLES[(storeRecord?.buttonStyle ?? DEFAULT_SETTINGS.buttonStyle)] ?? BUTTON_STYLES.rounded;
  const accent    = storeRecord?.primaryColor ?? DEFAULT_SETTINGS.primaryColor;
  const storeName = storeRecord?.name ?? user.name ?? username;
  const logoImage = storeRecord?.logoImage ?? null;

  const storePages = (storeRecord?.storePages as StoreSettings["storePages"]) ?? {};
  const pageData   = storePages?.faq;
  const pageTitle  = pageData?.title ?? "FAQ";
  const items      = pageData?.items ?? [];

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
        <h1 className="font-black text-4xl mb-10" style={{ color: theme.text }}>{pageTitle}</h1>

        {items.length > 0 ? (
          <div className="space-y-3 max-w-2xl">
            {items.map((item, i) => (
              <details key={i}
                className="group border rounded-2xl overflow-hidden"
                style={{ borderColor: theme.border, background: theme.surface }}>
                <summary
                  className="flex items-center justify-between px-5 py-4 cursor-pointer select-none list-none font-semibold text-sm"
                  style={{ color: theme.text }}>
                  {item.q}
                  <span className="ml-4 flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full border text-xs transition-transform group-open:rotate-45"
                    style={{ borderColor: theme.border, color: theme.muted }}>
                    +
                  </span>
                </summary>
                {item.a && (
                  <div className="px-5 pb-4 text-sm leading-relaxed border-t" style={{ borderColor: theme.border, color: theme.muted }}>
                    <div className="pt-3 whitespace-pre-wrap">{item.a}</div>
                  </div>
                )}
              </details>
            ))}
          </div>
        ) : (
          <p className="text-sm italic" style={{ color: theme.muted }}>
            No FAQ items have been added yet.
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
          <Link href={`/${username}/store/contact`}
            className="text-sm font-medium hover:opacity-70 transition-opacity"
            style={{ color: accent }}>
            Contact →
          </Link>
        </div>
      </footer>
    </div>
  );
}
