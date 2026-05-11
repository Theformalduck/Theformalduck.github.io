"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Eye, Zap, Palette, ExternalLink, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardSidebar from "@/components/DashboardSidebar";
import { PRESETS, FONTS, cardBg, cardFilter, pageBackground, type Preset } from "@/lib/presets";

/* ── Category filter config ── */
const CATS = [
  { id: "all",      label: "All" },
  { id: "dark",     label: "Dark" },
  { id: "light",    label: "Light" },
  { id: "gradient", label: "Gradient" },
  { id: "mono",     label: "Terminal" },
];

function presetCat(p: Preset): string[] {
  const cats = ["all"];
  if (p.bg.startsWith("#f") || p.bg.startsWith("#fa")) cats.push("light"); else cats.push("dark");
  if (p.bgGradient) cats.push("gradient");
  if (p.font === "mono") cats.push("mono");
  return cats;
}

/* ── Mini portfolio preview inside a card ── */
function PresetThumbnail({ preset }: { preset: Preset }) {
  const accent = preset.accent;
  const r = Math.min(preset.radius, 10);
  const cardStyle: React.CSSProperties = {
    background: cardBg(preset),
    backdropFilter: cardFilter(preset),
    WebkitBackdropFilter: cardFilter(preset),
    border: `1px solid ${preset.border}`,
    borderRadius: r,
    boxShadow: preset.shadow === "none" ? undefined : preset.shadow,
  };
  const fontFamily = FONTS[preset.font];

  return (
    <div style={{ background: pageBackground(preset), height: 168, overflow: "hidden", fontFamily, position: "relative" }}>
      {/* Nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: `1px solid ${preset.border}` }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: preset.text }}>JD.</span>
        <div style={{ display: "flex", gap: 8, fontSize: 9, color: `${preset.text}60` }}>
          <span>About</span><span>Work</span><span>Contact</span>
        </div>
        <div style={{ fontSize: 8, padding: "3px 8px", borderRadius: Math.min(r, 6), background: accent, color: preset.bg, fontWeight: 700 }}>
          Hire me
        </div>
      </div>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "10px 12px 8px" }}>
        <div style={{ width: 28, height: 28, borderRadius: Math.max(r, 8), background: `linear-gradient(135deg, ${accent}, ${accent}80)`, margin: "0 auto 6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: preset.bg }}>
          JD
        </div>
        <div style={{ height: 7, width: "55%", background: preset.text, opacity: 0.75, borderRadius: 3, margin: "0 auto 4px" }} />
        <div style={{ height: 5, width: "38%", background: preset.text, opacity: 0.35, borderRadius: 2, margin: "0 auto" }} />
      </div>

      {/* Cards row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: "0 10px" }}>
        {[0, 1].map(i => (
          <div key={i} style={{ ...cardStyle, padding: "8px 10px" }}>
            <div style={{ height: 5, width: "70%", background: preset.text, opacity: 0.6, borderRadius: 2, marginBottom: 4 }} />
            <div style={{ height: 4, width: "90%", background: preset.text, opacity: 0.25, borderRadius: 2, marginBottom: 6 }} />
            <div style={{ display: "flex", gap: 3 }}>
              <div style={{ height: 12, width: 28, borderRadius: 4, background: `${accent}28`, border: `1px solid ${accent}40` }} />
              <div style={{ height: 12, width: 22, borderRadius: 4, background: `${accent}18`, border: `1px solid ${accent}30` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Individual preset card ── */
function PresetCard({
  preset,
  active,
  onSelect,
  onApply,
  onPreview,
}: {
  preset: Preset;
  active: boolean;
  onSelect: () => void;
  onApply: () => void;
  onPreview: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const fontLabel = { system: "Sans-serif", serif: "Serif", mono: "Monospace", elegant: "Elegant" }[preset.font];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onSelect}
      className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all ${
        active ? "ring-2 ring-indigo-400/60 shadow-lg shadow-indigo-500/10" : "hover:ring-1 hover:ring-white/20"
      }`}
      style={{ border: `1px solid ${active ? "rgba(129,140,248,0.3)" : "rgba(255,255,255,0.06)"}` }}
    >
      {/* Live thumbnail */}
      <div className="relative overflow-hidden">
        <PresetThumbnail preset={preset} />

        {/* Hover overlay */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center gap-2"
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
            >
              <button
                onClick={e => { e.stopPropagation(); onPreview(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-medium hover:bg-white/20 transition-all border border-white/20"
              >
                <Eye className="w-3.5 h-3.5" /> Preview
              </button>
              <button
                onClick={e => { e.stopPropagation(); onApply(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{ background: preset.accent, color: preset.bg }}
              >
                {active ? <><Check className="w-3.5 h-3.5" />Applied</> : <><Zap className="w-3.5 h-3.5" />Apply</>}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active badge */}
        {active && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-lg">
            <Check className="w-3 h-3 text-[#060608]" />
          </div>
        )}
      </div>

      {/* Info row */}
      <div className="bg-white/[0.025] px-3.5 py-2.5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-white/90 leading-tight">{preset.label}</p>
          <p className="text-[10px] text-white/35 mt-0.5">{preset.desc}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/30">{fontLabel}</span>
          {preset.cardStyle === "glass" && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.05] text-white/40 border border-white/[0.08]">Glass</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Page ── */
export default function ThemesPage() {
  const router = useRouter();
  const [activeCat, setActiveCat] = useState("all");
  const [activePreset, setActivePreset] = useState<string>("void");
  const [selectedPreset, setSelectedPreset] = useState<string>("void");
  const [saving, setSaving] = useState(false);
  const [subdomain, setSubdomain] = useState<string | null>(null);

  // Load current portfolio preset from API
  useEffect(() => {
    fetch("/api/user/portfolio")
      .then(r => r.json())
      .then(json => {
        if (json.theme) { setActivePreset(json.theme); setSelectedPreset(json.theme); }
        if (json.subdomain) setSubdomain(json.subdomain);
      })
      .catch(() => {});
  }, []);

  const filtered = PRESETS.filter(p => presetCat(p).includes(activeCat));

  const applyPreset = async (presetId: string) => {
    setSaving(true);
    try {
      // Fetch current portfolio data to merge with new theme
      const getRes = await fetch("/api/user/portfolio");
      const current = await getRes.json();
      await fetch("/api/user/portfolio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: current.data ?? null,
          theme: presetId,
          subdomain: current.subdomain ?? null,
          published: current.published ?? false,
        }),
      });
      setActivePreset(presetId);
      setSelectedPreset(presetId);
      toast.success(`${PRESETS.find(p => p.id === presetId)?.label} applied!`, {
        description: "Open the portfolio editor to see it live.",
        action: { label: "Open editor", onClick: () => router.push("/editor/portfolio") },
      });
    } catch {
      toast.error("Failed to apply preset");
    } finally {
      setSaving(false);
    }
  };

  const openPreview = () => {
    if (subdomain) window.open(`/p/${subdomain}`, "_blank");
    else window.open("/portfolio/preview", "_blank");
  };

  const currentPreset = PRESETS.find(p => p.id === activePreset);

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />

      <main className="flex-1 ml-[220px] min-h-screen">
        {/* Top bar */}
        <div className="h-16 border-b border-white/[0.05] flex items-center justify-between px-8 bg-white/[0.03] backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-pink-400" />
            <h1 className="font-semibold text-white">Design Presets</h1>
            {currentPreset && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] ml-2">
                <div className="w-2 h-2 rounded-full" style={{ background: currentPreset.accent }} />
                <span className="text-xs text-white/50">Active: <span className="text-white/80">{currentPreset.label}</span></span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openPreview}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 hover:bg-white/[0.07] transition-all"
            >
              <Eye className="w-3.5 h-3.5" /> Preview portfolio
            </button>
            <Link
              href="/editor/portfolio"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-white/[0.05] border border-white/[0.1] text-white/55 hover:bg-white/[0.08] transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open editor
            </Link>
          </div>
        </div>

        <div className="p-8">
          {/* AI suggestion banner */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white/[0.025] border border-white/[0.06] px-6 py-4 flex items-center gap-4 mb-8"
          >
            <div className="w-10 h-10 rounded-xl bg-white/[0.08] flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white/90">
                Pick a preset, then fine-tune accent color and font in the <strong className="text-white/70">portfolio editor</strong>
              </p>
              <p className="text-xs text-white/40 mt-0.5">Changes apply instantly — hover any card and hit Apply</p>
            </div>
            <Link
              href="/editor/portfolio"
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-[#060608] hover:bg-white/90 transition-all"
            >
              Customise →
            </Link>
          </motion.div>

          {/* Category tabs */}
          <div className="flex items-center gap-2 mb-6">
            {CATS.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeCat === cat.id
                    ? "bg-white/[0.08] text-white border border-white/[0.15]"
                    : "text-white/35 hover:text-white/70 hover:bg-white/[0.04]"
                }`}
              >
                {cat.label}
                <span className="ml-1.5 text-[10px] opacity-50">
                  {cat.id === "all" ? PRESETS.length : PRESETS.filter(p => presetCat(p).includes(cat.id)).length}
                </span>
              </button>
            ))}
          </div>

          {/* Preset grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((preset, i) => (
                <motion.div
                  key={preset.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <PresetCard
                    preset={preset}
                    active={activePreset === preset.id}
                    onSelect={() => setSelectedPreset(preset.id)}
                    onApply={() => applyPreset(preset.id)}
                    onPreview={openPreview}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <Palette className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/30 text-sm">No presets in this category</p>
            </div>
          )}

          {/* Selected preset detail bar */}
          <AnimatePresence>
            {selectedPreset !== activePreset && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-3 rounded-2xl shadow-2xl"
                style={{ background: "rgba(12,12,20,0.95)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)" }}
              >
                {(() => {
                  const p = PRESETS.find(x => x.id === selectedPreset);
                  if (!p) return null;
                  return (
                    <>
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.accent }} />
                      <span className="text-sm text-white/80 font-medium">{p.label}</span>
                      <span className="text-xs text-white/35">{p.desc}</span>
                      <div className="w-px h-4 bg-white/10" />
                      <button
                        onClick={() => applyPreset(selectedPreset)}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                        style={{ background: p.accent, color: p.bg }}
                      >
                        {saving ? "Applying…" : <><Zap className="w-3.5 h-3.5" />Apply preset</>}
                      </button>
                      <button
                        onClick={() => setSelectedPreset(activePreset)}
                        className="text-xs text-white/35 hover:text-white/60 transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
