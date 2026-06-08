export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { STORE_THEMES } from "@/lib/store-themes";

export async function generateMetadata(props: PageProps<"/[username]/store/collections">): Promise<Metadata> {
  const { username } = await props.params;
  const user = await db.user.findUnique({ where: { username }, select: { name: true } });
  return { title: `Collections — ${user?.name ?? username}` };
}

export default async function CollectionsListPage(props: PageProps<"/[username]/store/collections">) {
  const { username } = await props.params;

  const user = await db.user.findUnique({
    where: { username },
    select: { id: true, name: true, username: true },
  });
  if (!user) notFound();

  const [storeRecord, collections] = await Promise.all([
    db.store.findUnique({ where: { userId: user.id }, select: { name: true, theme: true, primaryColor: true } }).catch(() => null),
    db.collection.findMany({
      where: { userId: user.id },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { products: { where: { status: "ACTIVE" } } } } },
    }),
  ]);

  const theme = STORE_THEMES[storeRecord?.theme ?? "default"] ?? STORE_THEMES.default;
  const accent = storeRecord?.primaryColor ?? "#2e9cfe";

  return (
    <div style={{ background: theme.bg, color: theme.text, minHeight: "100vh" }}>
      <header className="border-b sticky top-0 z-40" style={{ borderColor: theme.border, background: theme.navBg }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-14 flex items-center gap-4">
          <Link href={`/${user.username}/store`} className="flex items-center gap-2 text-sm hover:opacity-70" style={{ color: theme.muted }}>
            ← Back to store
          </Link>
          <span className="ml-auto font-semibold text-sm" style={{ color: theme.text }}>{storeRecord?.name ?? user.name ?? username}</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
        <h1 className="font-black text-3xl tracking-tight mb-6" style={{ color: theme.text }}>Collections</h1>

        {collections.length === 0 ? (
          <p className="text-sm py-16 text-center" style={{ color: theme.muted }}>No collections yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {collections.map(c => (
              <Link key={c.id} href={`/${user.username}/store/collections/${c.slug}`}
                className="group rounded-2xl overflow-hidden border transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ borderColor: theme.border, background: theme.surface }}>
                <div className="aspect-[4/3] overflow-hidden relative" style={{ background: theme.surfaceHover }}>
                  {c.image
                    ? <img src={c.image} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center text-4xl font-black opacity-15" style={{ color: accent }}>{c.name.charAt(0)}</div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-4">
                    <h2 className="text-white font-bold text-lg">{c.name}</h2>
                    <p className="text-white/80 text-xs">{c._count.products} product{c._count.products !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                {c.description && <p className="p-4 text-sm" style={{ color: theme.muted }}>{c.description}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
