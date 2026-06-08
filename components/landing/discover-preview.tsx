import Link from "next/link";
import { db } from "@/lib/db";
import { CanvasThumbnail } from "@/app/[username]/canvas-renderer";
import { ArrowRight, BadgeCheck, Compass } from "lucide-react";

export async function DiscoverPreview() {
  let creators: Array<{
    username: string | null; name: string | null; image: string | null; verified: boolean;
    portfolio: { title: string | null; canvasData: unknown; primaryColor: string } | null;
  }> = [];

  try {
    creators = await db.user.findMany({
      where: { username: { not: null }, bannedAt: null, portfolio: { published: true } },
      select: {
        username: true, name: true, image: true, verified: true,
        portfolio: { select: { title: true, canvasData: true, primaryColor: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    });
  } catch {
    creators = [];
  }

  // Don't render the section at all if there's nothing to show yet.
  if (creators.length === 0) return null;

  const bg = (c: typeof creators[number]) => {
    const data = c.portfolio?.canvasData as any;
    return data?.pages?.[0]?.bg ?? c.portfolio?.primaryColor ?? "#1099e0";
  };

  return (
    <section className="py-24 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[11px] font-bold uppercase tracking-wider mb-3">
              <Compass className="w-3.5 h-3.5" /> Discover
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Real creators, real businesses
            </h2>
            <p className="text-gray-500 mt-2 max-w-md">
              Browse portfolios and shops from creators building on Sellora.
            </p>
          </div>
          <Link href="/discover"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors flex-shrink-0">
            Browse all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {creators.map((c) => (
            <Link key={c.username} href={`/${c.username}`}
              className="group rounded-2xl overflow-hidden border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all bg-white">
              {(c.portfolio?.canvasData as any)?.version === 1 ? (
                <CanvasThumbnail doc={c.portfolio!.canvasData as any} height={104} />
              ) : (
                <div className="h-[104px]" style={{ background: bg(c) }} />
              )}
              <div className="p-3 -mt-6">
                {c.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-white shadow mb-1.5" />
                ) : (
                  <div className="w-9 h-9 rounded-full border-2 border-white shadow mb-1.5 bg-gray-700 text-white flex items-center justify-center text-[11px] font-bold">
                    {(c.name ?? c.username ?? "?").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-gray-900 truncate">{c.name ?? c.username}</span>
                  {c.verified && <BadgeCheck className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                </div>
                <p className="text-[11px] text-gray-400 truncate">@{c.username}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
