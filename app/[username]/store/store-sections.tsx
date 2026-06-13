"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, ChevronDown, ShoppingCart } from "lucide-react";
import { SECTION_NATURAL, type StoreSection, type Block } from "@/lib/store-sections";

type Theme = { bg: string; surface: string; surfaceHover: string; border: string; text: string; muted: string };
type Product = { id: string; name: string; price: number; images: string[] };

interface Props {
  sections: StoreSection[];
  theme: Theme;
  accent: string;
  accentText: string;
  products: Product[];
  username: string;
  formatCurrency: (n: number) => string;
  onAddToCart?: (p: Product) => void;
  btnRadius?: string;
}

export function StoreSections({ sections, theme, accent, accentText, products, username, formatCurrency, onAddToCart, btnRadius = "rounded-lg" }: Props) {
  if (!Array.isArray(sections) || sections.length === 0) return null;
  return (
    <div className="store-sections">
      {sections.map((s) => (
        <SectionBlock key={s.id} s={s} theme={theme} accent={accent} accentText={accentText}
          products={products} username={username} formatCurrency={formatCurrency} onAddToCart={onAddToCart} btnRadius={btnRadius} />
      ))}
    </div>
  );
}

function SectionBlock({ s, theme, accent, accentText, products, username, formatCurrency, onAddToCart, btnRadius }: { s: StoreSection } & Omit<Props, "sections">) {
  // Per-section design, width, vertical padding & background, with per-type
  // natural defaults so unconfigured sections look exactly as before.
  const nat = SECTION_NATURAL[s.type];
  const WIDTHS = { narrow: "max-w-2xl", normal: "max-w-6xl", wide: "max-w-7xl", full: "max-w-full" } as const;
  const PAD = { none: 0, sm: 32, md: 64, lg: 96, xl: 128 } as const;
  const wrap = `${WIDTHS[s.width ?? nat.width]} mx-auto px-6 sm:px-10`;
  const padStyle = { paddingTop: PAD[s.padTop ?? "md"], paddingBottom: PAD[s.padBottom ?? "md"] };
  const bgKey = s.bg ?? nat.bg;
  const sectionBg = bgKey === "custom" ? (s.bgColor || theme.bg) : bgKey === "surface" ? theme.surface : theme.bg;

  if (s.type === "banner") {
    return (
      <section className="relative" style={{
        ...padStyle,
        background: s.image ? undefined : sectionBg,
        ...(s.image ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.45),rgba(0,0,0,0.45)), url(${s.image})`, backgroundSize: "cover", backgroundPosition: "center" } : {}),
      }}>
        <div className={`${wrap} ${s.align === "center" ? "text-center" : "text-left"}`}>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: s.image ? "#fff" : theme.text }}>{s.heading}</h2>
          {s.subtext && <p className="text-base sm:text-lg max-w-xl mb-6" style={{ color: s.image ? "rgba(255,255,255,0.85)" : theme.muted, ...(s.align === "center" ? { marginLeft: "auto", marginRight: "auto" } : {}) }}>{s.subtext}</p>}
          {s.ctaLabel && (
            <a href={s.ctaUrl || "#products"} className={`inline-flex items-center px-6 py-3 text-sm font-semibold ${btnRadius}`} style={{ background: accent, color: accentText }}>
              {s.ctaLabel}
            </a>
          )}
        </div>
      </section>
    );
  }

  if (s.type === "richtext") {
    return (
      <section style={{ ...padStyle, background: sectionBg }}>
        <div className={`${wrap} ${s.align === "center" ? "text-center" : ""}`}>
          {s.heading && <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: theme.text }}>{s.heading}</h2>}
          <p className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: theme.muted }}>{s.body}</p>
          {s.ctaLabel && (
            <div className="mt-6">
              <a href={s.ctaUrl || "#products"} className={`inline-flex items-center px-6 py-3 text-sm font-semibold ${btnRadius}`} style={{ background: accent, color: accentText }}>
                {s.ctaLabel}
              </a>
            </div>
          )}
        </div>
      </section>
    );
  }

  if (s.type === "featured") {
    const items = products.slice(0, Math.max(1, Math.min(8, s.count)));
    if (items.length === 0) return null;
    return (
      <section style={{ ...padStyle, background: sectionBg }}>
        <div className={wrap}>
          {s.heading && <h2 className="text-2xl sm:text-3xl font-bold mb-8" style={{ color: theme.text }}>{s.heading}</h2>}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {items.map((p) => (
              <div key={p.id} className="group">
                <Link href={`/${username}/store/products/${p.id}`} className="block">
                  <div className="aspect-square overflow-hidden rounded-xl mb-3" style={{ background: theme.surfaceHover }}>
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full flex items-center justify-center" style={{ color: theme.muted }}><ShoppingCart className="w-8 h-8 opacity-40" /></div>}
                  </div>
                  <p className="text-sm font-medium truncate" style={{ color: theme.text }}>{p.name}</p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: accent }}>{formatCurrency(p.price)}</p>
                </Link>
                {onAddToCart && (
                  <button onClick={() => onAddToCart(p)} className={`mt-2 w-full py-2 text-xs font-semibold ${btnRadius}`} style={{ background: accent, color: accentText }}>
                    Add to cart
                  </button>
                )}
              </div>
            ))}
          </div>
          {s.ctaLabel && (
            <div className="mt-8 text-center">
              <a href={s.ctaUrl || "#products"} className={`inline-flex items-center px-6 py-3 text-sm font-semibold ${btnRadius}`} style={{ background: accent, color: accentText }}>
                {s.ctaLabel}
              </a>
            </div>
          )}
        </div>
      </section>
    );
  }

  if (s.type === "gallery") {
    const imgs = (s.images ?? []).filter(Boolean);
    if (!imgs.length) return null;
    const cols = s.columns ?? 3;
    const gap = s.gap ?? "md";
    const gapPx = gap === "sm" ? 8 : gap === "lg" ? 20 : 12;
    const aspectCls = s.aspect === "portrait" ? "aspect-[3/4]" : s.aspect === "landscape" ? "aspect-video" : s.aspect === "auto" ? "" : "aspect-square";

    if (s.layout === "masonry") {
      // CSS multi-column masonry: images keep their natural proportions.
      const colCls = cols === 2 ? "columns-2" : cols === 4 ? "columns-2 md:columns-4" : "columns-2 md:columns-3";
      return (
        <section style={{ ...padStyle, background: sectionBg }}>
          <div className={wrap}>
            {s.heading && <h2 className="text-2xl sm:text-3xl font-bold mb-8" style={{ color: theme.text }}>{s.heading}</h2>}
            <div className={colCls} style={{ columnGap: gapPx }}>
              {imgs.map((img, i) => (
                <div key={i} className="overflow-hidden rounded-xl break-inside-avoid" style={{ background: theme.surfaceHover, marginBottom: gapPx }}>
                  <img src={img} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} className="w-full h-auto hover:scale-105 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    const colCls = cols === 2 ? "grid-cols-2" : cols === 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-3";
    return (
      <section style={{ ...padStyle, background: sectionBg }}>
        <div className={wrap}>
          {s.heading && <h2 className="text-2xl sm:text-3xl font-bold mb-8" style={{ color: theme.text }}>{s.heading}</h2>}
          <div className={`grid ${colCls}`} style={{ gap: gapPx }}>
            {imgs.map((img, i) => (
              <div key={i} className={`${aspectCls} overflow-hidden rounded-xl`} style={{ background: theme.surfaceHover }}>
                <img src={img} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} className={`w-full ${s.aspect === "auto" ? "h-auto" : "h-full object-cover"} hover:scale-105 transition-transform duration-500`} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (s.type === "testimonials") {
    if (!s.items?.length) return null;
    return (
      <section style={{ ...padStyle, background: sectionBg }}>
        <div className={wrap}>
          {s.heading && <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center" style={{ color: theme.text }}>{s.heading}</h2>}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {s.items.map((t, i) => (
              <div key={i} className="rounded-2xl p-6 border" style={{ background: theme.bg, borderColor: theme.border }}>
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="w-4 h-4" style={{ fill: j < t.rating ? "#fbbf24" : "transparent", color: j < t.rating ? "#fbbf24" : theme.border }} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: theme.text }}>&ldquo;{t.quote}&rdquo;</p>
                <p className="text-xs font-semibold" style={{ color: theme.muted }}>{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (s.type === "faq") {
    if (!s.items?.length) return null;
    return (
      <section style={{ ...padStyle, background: sectionBg }}>
        <div className={wrap}>
          {s.heading && <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center" style={{ color: theme.text }}>{s.heading}</h2>}
          <div className="space-y-2">
            {s.items.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} theme={theme} />)}
          </div>
        </div>
      </section>
    );
  }

  if (s.type === "video") {
    if (!s.youtubeId) return null;
    return (
      <section style={{ ...padStyle, background: sectionBg }}>
        <div className={wrap}>
          {s.heading && <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center" style={{ color: theme.text }}>{s.heading}</h2>}
          <div className="aspect-video rounded-2xl overflow-hidden" style={{ background: "#000" }}>
            <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${s.youtubeId}`} title={s.heading}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
        </div>
      </section>
    );
  }

  if (s.type === "newsletter") {
    return (
      <section style={{ ...padStyle, background: sectionBg }}>
        <div className={`${wrap} text-center`}>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: theme.text }}>{s.heading}</h2>
          {s.subtext && <p className="text-sm mb-6" style={{ color: theme.muted }}>{s.subtext}</p>}
          <form onSubmit={(e) => e.preventDefault()} className="flex gap-2 max-w-md mx-auto">
            <input type="email" required placeholder="you@example.com"
              className="flex-1 px-4 py-3 rounded-lg text-sm outline-none border"
              style={{ background: theme.bg, borderColor: theme.border, color: theme.text }} />
            <button type="submit" className={`px-5 py-3 text-sm font-semibold ${btnRadius}`} style={{ background: accent, color: accentText }}>
              {s.buttonLabel || "Subscribe"}
            </button>
          </form>
        </div>
      </section>
    );
  }

  if (s.type === "blocks") {
    const blocks = (s.blocks ?? []).filter(Boolean);
    if (!blocks.length) return null;
    return (
      <section style={{ ...padStyle, background: sectionBg }}>
        <div className={wrap}>
          <div className="space-y-4">
            {blocks.map((b) => (
              <BlockView key={b.id} b={b} theme={theme} accent={accent} accentText={accentText} btnRadius={btnRadius} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (s.type === "countdown") {
    return (
      <section style={{ ...padStyle, background: sectionBg }}>
        <div className={`${wrap} text-center`}>
          {s.heading && <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: theme.text }}>{s.heading}</h2>}
          {s.subtext && <p className="text-sm mb-8" style={{ color: theme.muted }}>{s.subtext}</p>}
          <CountdownTimer endsAt={s.endsAt} expiredText={s.expiredText} theme={theme} accent={accent} />
          {s.ctaLabel && (
            <a href={s.ctaUrl || "#products"} className={`inline-flex items-center mt-8 px-7 py-3 text-sm font-bold ${btnRadius}`}
              style={{ background: accent, color: accentText }}>
              {s.ctaLabel}
            </a>
          )}
        </div>
      </section>
    );
  }

  if (s.type === "spotlight") {
    // Resolve the chosen product; fall back to the newest one so the section
    // never renders empty just because nothing is picked yet.
    const product = products.find((p) => p.id === s.productId) ?? products[0];
    if (!product) return null;
    return (
      <section style={{ ...padStyle, background: sectionBg }}>
        <div className={`${wrap} grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-center`}>
          <div className={s.layout === "right" ? "md:order-2" : ""}>
            <Link href={`/${username}/store/products/${product.id}`} className="block rounded-2xl overflow-hidden aspect-square" style={{ background: theme.surfaceHover }}>
              {product.images?.[0] ? (
                <img src={product.images[0]} alt={product.name} onError={(e) => { e.currentTarget.style.display = "none"; }}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ color: theme.muted }}>
                  <ShoppingCart className="w-10 h-10 opacity-40" />
                </div>
              )}
            </Link>
          </div>
          <div className={s.layout === "right" ? "md:order-1" : ""}>
            {s.heading && <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: accent }}>{s.heading}</p>}
            <Link href={`/${username}/store/products/${product.id}`}>
              <h2 className="text-3xl sm:text-4xl font-black mb-3 hover:opacity-80 transition-opacity" style={{ color: theme.text }}>{product.name}</h2>
            </Link>
            {s.blurb && <p className="text-sm leading-relaxed mb-5" style={{ color: theme.muted }}>{s.blurb}</p>}
            <p className="text-2xl font-bold mb-6" style={{ color: theme.text }}>{formatCurrency(product.price)}</p>
            <div className="flex items-center gap-3 flex-wrap">
              {onAddToCart && (
                <button onClick={() => onAddToCart(product)} className={`inline-flex items-center gap-2 px-7 py-3 text-sm font-bold ${btnRadius}`}
                  style={{ background: accent, color: accentText }}>
                  <ShoppingCart className="w-4 h-4" /> Add to cart
                </button>
              )}
              <Link href={`/${username}/store/products/${product.id}`} className={`inline-flex items-center px-6 py-3 text-sm font-medium border ${btnRadius}`}
                style={{ borderColor: theme.border, color: theme.text }}>
                View details
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return null;
}

// Live countdown. Starts empty and fills on mount so the server-rendered HTML
// never disagrees with the client (no hydration mismatch), then ticks per second.
function CountdownTimer({ endsAt, expiredText, theme, accent }: { endsAt: string; expiredText: string; theme: Theme; accent: string }) {
  const [left, setLeft] = useState<{ d: number; h: number; m: number; s: number } | null | "expired">(null);

  useEffect(() => {
    const target = new Date(endsAt).getTime();
    if (Number.isNaN(target)) { setLeft("expired"); return; }
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setLeft("expired"); return; }
      setLeft({
        d: Math.floor(diff / 86_400_000),
        h: Math.floor(diff / 3_600_000) % 24,
        m: Math.floor(diff / 60_000) % 60,
        s: Math.floor(diff / 1_000) % 60,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (left === "expired") {
    return <p className="text-lg font-semibold" style={{ color: theme.muted }}>{expiredText || "This offer has ended."}</p>;
  }

  const cells: { label: string; value: number }[] = [
    { label: "Days", value: left?.d ?? 0 },
    { label: "Hours", value: left?.h ?? 0 },
    { label: "Mins", value: left?.m ?? 0 },
    { label: "Secs", value: left?.s ?? 0 },
  ];
  return (
    <div className="flex items-stretch justify-center gap-3 sm:gap-4" aria-live="polite">
      {cells.map((c) => (
        <div key={c.label} className="w-18 sm:w-20 rounded-2xl border px-3 py-3 sm:py-4 min-w-[4.2rem]"
          style={{ borderColor: theme.border, background: theme.bg }}>
          <div className="text-2xl sm:text-3xl font-black tabular-nums" style={{ color: accent }}>
            {left ? String(c.value).padStart(2, "0") : "–"}
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: theme.muted }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}

// One sub-block inside a Flexible section.
function BlockView({ b, theme, accent, accentText, btnRadius = "rounded-lg" }: { b: Block; theme: Theme; accent: string; accentText: string; btnRadius?: string }) {
  if (b.type === "heading") {
    const sizeCls = b.size === "sm" ? "text-lg sm:text-xl" : b.size === "lg" ? "text-3xl sm:text-4xl" : b.size === "xl" ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl";
    return <div style={{ textAlign: b.align }}><h2 className={`font-bold leading-tight ${sizeCls}`} style={{ color: theme.text }}>{b.text}</h2></div>;
  }
  if (b.type === "text") {
    return <div style={{ textAlign: b.align }}><p className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: theme.muted }}>{b.text}</p></div>;
  }
  if (b.type === "button") {
    if (!b.label) return null;
    const outline = b.variant === "outline";
    return (
      <div style={{ textAlign: b.align }}>
        <a href={b.url || "#"} className={`inline-flex items-center px-6 py-3 text-sm font-semibold ${btnRadius} ${outline ? "border-2" : ""}`}
          style={outline ? { borderColor: accent, color: accent } : { background: accent, color: accentText }}>
          {b.label}
        </a>
      </div>
    );
  }
  if (b.type === "marquee") {
    const text = (b.text || "").trim();
    if (!text) return null;
    const dur = b.speed === "slow" ? 38 : b.speed === "fast" ? 14 : 24;
    const reverse = b.direction === "right";
    const fontSize = b.size === "md" ? "clamp(1.75rem, 5vw, 3.25rem)" : b.size === "xl" ? "clamp(3.5rem, 12vw, 10rem)" : "clamp(2.75rem, 8vw, 6.5rem)";
    const fade = "linear-gradient(90deg, transparent, #000 2%, #000 98%, transparent)";
    // Break out of the section's horizontal padding so the text runs the full
    // viewport width, edge to edge.
    const bleed: React.CSSProperties = { width: "100vw", maxWidth: "100vw", marginLeft: "calc(50% - 50vw)" };

    // Curved arc variant, text follows a gentle SVG path, scrolling along it.
    if (b.curved) {
      const pathId = `mq-${b.id}`;
      const vbFont = b.size === "md" ? 56 : b.size === "xl" ? 116 : 86;
      const unit = `${text}   `;
      const repeated = unit.repeat(16);
      return (
        <div className="overflow-hidden" aria-label={text} style={{ ...bleed, maskImage: fade, WebkitMaskImage: fade }}>
          <svg viewBox="0 0 1200 220" className="w-full block" style={{ aspectRatio: "1200 / 220" }} preserveAspectRatio="none" role="img">
            <defs><path id={pathId} d="M -200 174 Q 600 60 1400 174" fill="none" /></defs>
            <text fontWeight={900} fontSize={vbFont} fill={theme.text} style={{ letterSpacing: "-0.02em" }}>
              <textPath href={`#${pathId}`} startOffset="0%">
                {repeated}
                <animate attributeName="startOffset" from={reverse ? "-50%" : "0%"} to={reverse ? "0%" : "-50%"} dur={`${dur}s`} repeatCount="indefinite" />
              </textPath>
            </text>
          </svg>
        </div>
      );
    }

    // Straight ticker, duplicated runs translate seamlessly via the keyframe.
    return (
      <div className="overflow-hidden" style={{ ...bleed, maskImage: fade, WebkitMaskImage: fade }} aria-label={text}>
        <div className="marquee-anim flex w-max whitespace-nowrap" style={{ animation: `store-marquee ${dur}s linear infinite${reverse ? " reverse" : ""}` }}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="font-black pr-10 select-none" style={{ fontSize, color: theme.text, letterSpacing: "-0.02em" }} aria-hidden={i > 0}>{text}</span>
          ))}
        </div>
      </div>
    );
  }
  if (b.type === "image") {
    if (!b.url) return null;
    const mw = b.maxWidth === "sm" ? "max-w-xs" : b.maxWidth === "md" ? "max-w-md" : b.maxWidth === "lg" ? "max-w-2xl" : "max-w-full";
    return <div style={{ textAlign: b.align }}><img src={b.url} alt={b.alt || ""} className={`inline-block w-full ${mw} ${b.rounded ? "rounded-xl" : ""}`} /></div>;
  }
  if (b.type === "divider") {
    return <hr style={{ border: "none", borderTop: `1px solid ${theme.border}` }} />;
  }
  if (b.type === "spacer") {
    return <div style={{ height: b.size === "sm" ? 16 : b.size === "lg" ? 64 : 32 }} />;
  }
  return null;
}

function FaqItem({ q, a, theme }: { q: string; a: string; theme: Theme }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: theme.border, background: theme.surface }}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left">
        <span className="text-sm font-semibold" style={{ color: theme.text }}>{q}</span>
        <ChevronDown className="w-4 h-4 flex-shrink-0 transition-transform" style={{ color: theme.muted, transform: open ? "rotate(180deg)" : "" }} />
      </button>
      {open && <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: theme.muted }}>{a}</div>}
    </div>
  );
}
