export interface Preset {
  id: string;
  label: string;
  desc: string;
  // Colors
  bg: string;
  bgGradient?: string;
  card: string;
  cardStyle: "solid" | "glass" | "outlined";
  accent: string;
  text: string;
  border: string;
  // Typography
  font: "system" | "serif" | "mono" | "elegant";
  // Shape & depth
  radius: number;
  shadow: string;
}

export const PRESETS: Preset[] = [
  {
    id: "void",
    label: "Void",
    desc: "Ultra-minimal black",
    bg: "#000000", card: "#0d0d0d", cardStyle: "outlined",
    accent: "#ffffff", text: "#ffffff", border: "rgba(255,255,255,0.1)",
    font: "system", radius: 6, shadow: "none",
  },
  {
    id: "glass",
    label: "Glass",
    desc: "Frosted glass cards",
    bg: "#080c1e",
    bgGradient: "radial-gradient(ellipse at 20% 40%, rgba(99,102,241,0.18) 0%, transparent 55%), radial-gradient(ellipse at 80% 10%, rgba(139,92,246,0.12) 0%, transparent 50%)",
    card: "rgba(255,255,255,0.05)", cardStyle: "glass",
    accent: "#818cf8", text: "#e8eaff", border: "rgba(255,255,255,0.09)",
    font: "system", radius: 22, shadow: "0 8px 32px rgba(0,0,0,0.5)",
  },
  {
    id: "terminal",
    label: "Terminal",
    desc: "Green-on-black hacker",
    bg: "#010a01", card: "#071007", cardStyle: "outlined",
    accent: "#00e536", text: "#00cc30", border: "rgba(0,229,54,0.18)",
    font: "mono", radius: 4, shadow: "none",
  },
  {
    id: "brutalist",
    label: "Brutalist",
    desc: "Raw bold type on cream",
    bg: "#f2ede4", card: "#ffffff", cardStyle: "solid",
    accent: "#111111", text: "#0a0a0a", border: "rgba(0,0,0,0.18)",
    font: "system", radius: 0, shadow: "4px 4px 0 #111",
  },
  {
    id: "neon",
    label: "Neon Noir",
    desc: "Dark purple, hot pink glow",
    bg: "#060011", card: "#0e0020", cardStyle: "solid",
    accent: "#ff2b8a", text: "#ffe8f5", border: "rgba(255,43,138,0.18)",
    font: "system", radius: 16, shadow: "0 0 24px rgba(255,43,138,0.18)",
  },
  {
    id: "ocean",
    label: "Ocean",
    desc: "Deep navy, sky-blue accents",
    bg: "#010f1e", card: "#031c35", cardStyle: "solid",
    accent: "#38bdf8", text: "#e0f6ff", border: "rgba(56,189,248,0.14)",
    font: "system", radius: 16, shadow: "0 4px 24px rgba(0,15,35,0.7)",
  },
  {
    id: "paper",
    label: "Paper",
    desc: "Warm cream, editorial serif",
    bg: "#faf5ef", card: "#f0e8dc", cardStyle: "solid",
    accent: "#92400e", text: "#1c1410", border: "rgba(100,60,10,0.12)",
    font: "serif", radius: 12, shadow: "0 2px 14px rgba(80,40,5,0.1)",
  },
  {
    id: "aurora",
    label: "Aurora",
    desc: "Northern-lights gradient",
    bg: "#020410",
    bgGradient: "radial-gradient(ellipse at 0% 0%, rgba(16,185,129,0.14) 0%, transparent 50%), radial-gradient(ellipse at 100% 100%, rgba(124,58,237,0.14) 0%, transparent 50%)",
    card: "#080d1c", cardStyle: "solid",
    accent: "#34d399", text: "#ecfdf5", border: "rgba(52,211,153,0.12)",
    font: "system", radius: 20, shadow: "0 4px 24px rgba(0,0,20,0.6)",
  },
  {
    id: "sunset",
    label: "Sunset",
    desc: "Warm amber glow",
    bg: "#0c0501",
    bgGradient: "radial-gradient(ellipse at 50% 0%, rgba(251,146,60,0.14) 0%, transparent 55%)",
    card: "#1a0b02", cardStyle: "solid",
    accent: "#fb923c", text: "#fff7ed", border: "rgba(251,146,60,0.15)",
    font: "system", radius: 18, shadow: "0 4px 20px rgba(80,20,0,0.5)",
  },
  {
    id: "slate",
    label: "Slate",
    desc: "Cool gray, sharp corporate",
    bg: "#0c0e12", card: "#14181f", cardStyle: "solid",
    accent: "#6366f1", text: "#e8eaf0", border: "rgba(100,110,130,0.14)",
    font: "system", radius: 10, shadow: "0 2px 12px rgba(0,0,10,0.5)",
  },
  {
    id: "rosegold",
    label: "Rose Gold",
    desc: "Dark with metallic rose",
    bg: "#0a0506", card: "#160a0b", cardStyle: "solid",
    accent: "#f9a8b8", text: "#fff0f3", border: "rgba(249,168,184,0.14)",
    font: "elegant", radius: 18, shadow: "0 4px 20px rgba(60,5,10,0.5)",
  },
  {
    id: "midnight",
    label: "Midnight",
    desc: "Deep blue-black, lavender",
    bg: "#01030d", card: "#050c1f", cardStyle: "solid",
    accent: "#a78bfa", text: "#ede9fe", border: "rgba(167,139,250,0.13)",
    font: "system", radius: 18, shadow: "0 4px 24px rgba(0,0,20,0.7)",
  },
];

export const PRESET_MAP: Record<string, Preset> = Object.fromEntries(
  PRESETS.map(p => [p.id, p])
);

export function getPreset(id: string): Preset {
  return PRESET_MAP[id] ?? PRESETS[0];
}

export const FONTS: Record<string, string> = {
  system:  "system-ui, -apple-system, sans-serif",
  serif:   "Georgia, 'Times New Roman', serif",
  mono:    "'Courier New', Courier, monospace",
  elegant: "'Palatino Linotype', Palatino, 'Book Antiqua', serif",
};

export function cardBg(preset: Preset): string {
  if (preset.cardStyle === "glass")    return "rgba(255,255,255,0.045)";
  if (preset.cardStyle === "outlined") return "transparent";
  return preset.card;
}

export function cardFilter(preset: Preset): string | undefined {
  return preset.cardStyle === "glass" ? "blur(14px) saturate(160%)" : undefined;
}

export function pageBackground(preset: Preset): string {
  if (preset.bgGradient) return `${preset.bgGradient}, ${preset.bg}`;
  return preset.bg;
}
