"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import {
  Heart, Share2, MessageSquare, CheckCircle, Star, EyeOff,
  Play, X, ChevronLeft, ChevronRight, ExternalLink, Mail,
  Globe, ArrowUpRight, Edit3, Link2,
  Download, Package, Briefcase, RefreshCw,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Section {
  id: string;
  type: string;
  visible: boolean;
  order: number;
  content: Record<string, any>;
}

interface Campaign {
  id: string;
  title: string;
  raised: number;
  goal: number;
  deadline: string | null;
  status: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  type: string;
  images: string[];
  description: string | null;
}

export interface PortfolioSettings {
  fontFamily?: "modern" | "elegant" | "clean" | "mono" | "display";
  borderRadius?: "sharp" | "soft" | "pill";
  pageWidth?: "narrow" | "medium" | "wide";
  animations?: boolean;
  navStyle?: "tabs" | "pills" | "minimal" | "hidden";
  sectionSpacing?: "compact" | "normal" | "spacious";
  sectionTitleAlign?: "left" | "center";
  heroHeight?: "sm" | "md" | "lg";
  buttonStyle?: "rounded" | "pill" | "square";
  showProducts?: boolean;
}

const PORTFOLIO_FONTS: Record<string, { css: string; google?: string }> = {
  modern:  { css: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" },
  elegant: { css: "'Playfair Display', Georgia, serif",       google: "Playfair+Display:ital,wght@0,400;0,600;0,700;1,400" },
  clean:   { css: "'DM Sans', 'Helvetica Neue', sans-serif",  google: "DM+Sans:wght@300;400;500;600;700" },
  mono:    { css: "'JetBrains Mono', ui-monospace, monospace", google: "JetBrains+Mono:wght@400;500;600" },
  display: { css: "'Syne', 'Trebuchet MS', sans-serif",       google: "Syne:wght@400;600;700;800" },
};

export interface PortfolioClientProps {
  user: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
    bio: string | null;
    verified: boolean;
    _count: { followers: number; following: number };
  };
  portfolio: {
    id: string;
    title: string | null;
    template: string;
    primaryColor: string;
    published: boolean;
  } | null;
  sections: Section[];
  campaigns: Campaign[];
  products: Product[];
  isOwner: boolean;
  settings?: PortfolioSettings;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function toEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0`;
  if (url.includes("youtube.com/embed/")) return url;
  const vim = url.match(/vimeo\.com\/(\d+)/);
  if (vim) return `https://player.vimeo.com/video/${vim[1]}`;
  return null;
}

function isVideoFile(url: string) {
  return /\.(mp4|webm|mov|avi)(\?|$)/i.test(url);
}

function youtubeThumb(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return yt ? `https://img.youtube.com/vi/${yt[1]}/mqdefault.jpg` : null;
}

const TEMPLATE_MAP: Record<string, { bg: string; dark: boolean; surface: string; surfaceHover: string; border: string; text: string; muted: string }> = {
  minimal: { bg: "#ffffff",  dark: false, surface: "#ffffff",              surfaceHover: "#f9fafb",              border: "#e5e7eb",               text: "#111827",  muted: "#6b7280"               },
  light:   { bg: "#f1f5f9",  dark: false, surface: "#ffffff",              surfaceHover: "#f8fafc",              border: "#e2e8f0",               text: "#111827",  muted: "#64748b"               },
  bold:    { bg: "#0a0a0a",  dark: true,  surface: "rgba(255,255,255,0.05)", surfaceHover: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.08)", text: "#f0f4f8", muted: "rgba(255,255,255,0.45)" },
  glass:   { bg: "#070d1a",  dark: true,  surface: "rgba(255,255,255,0.04)", surfaceHover: "rgba(255,255,255,0.07)", border: "rgba(255,255,255,0.08)", text: "#f0f4f8", muted: "rgba(255,255,255,0.45)" },
  neon:    { bg: "#050505",  dark: true,  surface: "rgba(74,222,128,0.05)", surfaceHover: "rgba(74,222,128,0.09)", border: "rgba(74,222,128,0.18)", text: "#f0fdf4", muted: "rgba(240,253,244,0.5)"  },
  paper:   { bg: "#faf7f2",  dark: false, surface: "#f5f0e8",              surfaceHover: "#ede8df",              border: "#e7e1d9",               text: "#1c1917",  muted: "#78716c"               },
  forest:  { bg: "#0c1f0e",  dark: true,  surface: "rgba(134,239,172,0.04)", surfaceHover: "rgba(134,239,172,0.08)", border: "rgba(134,239,172,0.12)", text: "#f0fdf4", muted: "rgba(240,253,244,0.5)"  },
  sunset:  { bg: "#130a04",  dark: true,  surface: "rgba(251,146,60,0.04)", surfaceHover: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.15)", text: "#fff7ed", muted: "rgba(255,247,237,0.5)"  },
  ocean:   { bg: "#03101f",  dark: true,  surface: "rgba(56,189,248,0.04)", surfaceHover: "rgba(56,189,248,0.08)", border: "rgba(56,189,248,0.12)", text: "#f0f9ff", muted: "rgba(240,249,255,0.5)"  },
  cream:   { bg: "#fefdf8",  dark: false, surface: "#f5f3e8",              surfaceHover: "#ece9d8",              border: "#e7e5d8",               text: "#292524",  muted: "#78716c"               },
};

function getTheme(template: string, color: string) {
  const t = TEMPLATE_MAP[template] ?? TEMPLATE_MAP.minimal;
  return { ...t, accent: color };
}

// ── Animation variants ────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

// ── Section nav helpers ───────────────────────────────────────────────────────

const NAV_LABELS: Record<string, string> = {
  about: "About", skills: "Skills", projects: "Work",
  gallery: "Gallery", showreel: "Showreel", timeline: "Experience",
  testimonials: "Praise", store: "Shop", contact: "Contact",
};

// ── Sub-components ───────────────────────────────────────────────────────────

function SkillTag({ skill, color }: { skill: string; color: string }) {
  return (
    <motion.span
      variants={fadeUp}
      className="px-3 py-1.5 rounded-full text-sm font-medium"
      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
    >
      {skill}
    </motion.span>
  );
}

function ProjectCard({ p, color, dark, cardStyle = "shadow" }: { p: any; color: string; dark: boolean; cardStyle?: string }) {
  const embed = p.image ? toEmbedUrl(p.image) : null;
  const isVid = p.image ? isVideoFile(p.image) : false;
  const ytThumb = p.image ? youtubeThumb(p.image) : null;

  const cardBg =
    cardStyle === "flat"   ? (dark ? "rgba(255,255,255,0.03)" : "#fafafa") :
    cardStyle === "glass"  ? (dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.7)") :
                             (dark ? "rgba(255,255,255,0.05)" : "#ffffff");
  const cardBorder =
    cardStyle === "flat"   ? "none" :
    cardStyle === "glass"  ? `1px solid ${dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)"}` :
    cardStyle === "border" ? `2px solid ${color}30` :
                             `1px solid ${dark ? "rgba(255,255,255,0.08)" : "#e5e7eb"}`;
  const cardShadow = cardStyle === "shadow" ? undefined : "none";

  return (
    <motion.div
      variants={fadeUp}
      className="group rounded-2xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1"
      style={{
        background: cardBg,
        border: cardBorder,
        boxShadow: cardShadow,
      }}
    >
      {p.image && (
        <div className="relative overflow-hidden">
          {embed ? (
            <iframe
              src={embed}
              className="w-full h-44"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          ) : isVid ? (
            <video src={p.image} className="w-full h-44 object-cover" muted playsInline />
          ) : ytThumb ? (
            <div className="relative h-44">
              <img src={ytThumb} alt="" className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-red-600/90 flex items-center justify-center shadow-xl">
                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                </div>
              </div>
            </div>
          ) : (
            <img
              src={p.image}
              alt={p.title}
              className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
              style={{ objectPosition: p.imagePosition ?? "center" }}
            />
          )}
        </div>
      )}
      <div className="p-5">
        {p.type && (
          <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color }}>
            {p.type}
          </div>
        )}
        <div className="font-semibold text-base mb-1.5" style={{ color: dark ? "#f0f4f8" : "#111827" }}>
          {p.title}
        </div>
        {p.description && (
          <p className="text-sm leading-relaxed line-clamp-2" style={{ color: dark ? "rgba(255,255,255,0.45)" : "#6b7280" }}>
            {p.description}
          </p>
        )}
        {p.url && (
          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color }}
          >
            View project <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </motion.div>
  );
}

function GalleryLightbox({
  items,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  items: any[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const item = items[index];
  const embed = toEmbedUrl(item.url);
  const isVid = isVideoFile(item.url);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
      >
        <X className="w-5 h-5" />
      </button>
      {index > 0 && (
        <button
          onClick={e => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {index < items.length - 1 && (
        <button
          onClick={e => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
      <div className="max-w-4xl w-full max-h-[85vh]" onClick={e => e.stopPropagation()}>
        {embed ? (
          <iframe
            src={embed}
            className="w-full aspect-video rounded-2xl"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : isVid ? (
          <video src={item.url} className="w-full max-h-[85vh] rounded-2xl" controls autoPlay />
        ) : (
          <img src={item.url} alt={item.caption ?? ""} className="w-full max-h-[85vh] object-contain rounded-2xl" />
        )}
        {item.caption && (
          <p className="text-white/70 text-sm text-center mt-3">{item.caption}</p>
        )}
      </div>
      <div className="absolute bottom-4 text-white/40 text-sm">
        {index + 1} / {items.length}
      </div>
    </motion.div>
  );
}

function ContactForm({ email, color, dark }: { email: string; color: string; dark: boolean }) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    window.location.href = `mailto:${email}?subject=Message from ${encodeURIComponent(name)}&body=${encodeURIComponent(message)}`;
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  };

  const inputStyle = {
    background: dark ? "rgba(255,255,255,0.07)" : "#fff",
    border: `1px solid ${dark ? "rgba(255,255,255,0.12)" : "#e5e7eb"}`,
    color: dark ? "#f0f4f8" : "#111827",
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 text-left space-y-3 max-w-sm mx-auto">
      <input
        value={name} onChange={e => setName(e.target.value)}
        placeholder="Your name"
        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 transition-all"
        style={{ ...inputStyle, ["--tw-ring-color" as string]: `${color}40` }}
      />
      <textarea
        value={message} onChange={e => setMessage(e.target.value)}
        placeholder="Your message…"
        rows={4}
        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 transition-all resize-none"
        style={inputStyle}
      />
      <button
        type="submit"
        className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
        style={{ background: color }}
      >
        {sent ? "Opening email client…" : "Send message"}
      </button>
    </form>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PortfolioClient({
  user,
  portfolio,
  sections,
  campaigns,
  products,
  isOwner,
  settings = {},
}: PortfolioClientProps) {
  const [followCount, setFollowCount] = useState(user._count.followers);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("");
  const [lightbox, setLightbox] = useState<{ items: any[]; index: number } | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const color = portfolio?.primaryColor ?? "#29abe2";
  const template = portfolio?.template ?? "minimal";
  const theme = getTheme(template, color);

  // Derived settings
  const fontKey     = settings.fontFamily ?? "modern";
  const fontCss     = PORTFOLIO_FONTS[fontKey]?.css ?? "system-ui, sans-serif";
  const pageWidthClass   = { narrow: "max-w-3xl", medium: "max-w-5xl", wide: "max-w-6xl" }[settings.pageWidth ?? "wide"];
  const heroHeightClass  = { sm: "h-40 sm:h-52", md: "h-52 sm:h-64", lg: "h-64 sm:h-80" }[settings.heroHeight ?? "md"];
  const spacingClass     = { compact: "space-y-8", normal: "space-y-14", spacious: "space-y-20" }[settings.sectionSpacing ?? "normal"];
  const titleAlign       = settings.sectionTitleAlign ?? "left";
  const animEnabled      = settings.animations ?? true;
  const btnRadius        = { rounded: "rounded-xl", pill: "rounded-full", square: "rounded-none" }[settings.buttonStyle ?? "rounded"];
  const noAnim           = { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0, transition: { duration: 0 } } };
  const eFadeUp          = animEnabled ? fadeUp : noAnim;
  const eStagger         = animEnabled ? staggerContainer : noAnim;

  // Load Google Font
  useEffect(() => {
    const googleFont = PORTFOLIO_FONTS[fontKey]?.google;
    const existingLink = document.getElementById("pf-font") as HTMLLinkElement | null;
    if (!googleFont) { existingLink?.remove(); return; }
    const link: HTMLLinkElement = existingLink ?? document.createElement("link");
    link.id = "pf-font";
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${googleFont}&display=swap`;
    if (!existingLink) document.head.appendChild(link);
  }, [fontKey]);

  const sorted = [...sections].sort((a, b) => a.order - b.order);
  const visible = sorted.filter(s => s.visible);

  const getSection = (type: string) => visible.find(s => s.type === type);
  const hero         = getSection("hero");
  const about        = getSection("about");
  const skills       = getSection("skills");
  const projects     = getSection("projects");
  const gallery      = getSection("gallery");
  const timeline     = getSection("timeline");
  const testimonials = getSection("testimonials");
  const contact      = getSection("contact");

  const navSections = visible.filter(s => NAV_LABELS[s.type]);

  // Visit tracking
  useEffect(() => {
    const key = `visited_${user.username}`;
    if (typeof window !== "undefined" && !sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
    }
  }, [user.username]);

  // IntersectionObserver for active section
  useEffect(() => {
    if (navSections.length === 0) return;
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    navSections.forEach(s => {
      const el = document.getElementById(`section-${s.type}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [navSections.length]);

  const scrollTo = (type: string) => {
    document.getElementById(`section-${type}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    const res = await fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: user.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setIsFollowing(data.following);
      setFollowCount(c => data.following ? c + 1 : c - 1);
    }
    setFollowLoading(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: `${user.name ?? user.username} on Sellora`, url });
    } else {
      await navigator.clipboard.writeText(url);
      setShareMsg("Link copied!");
      setTimeout(() => setShareMsg(null), 2000);
    }
  };

  const coverImage      = (hero?.content as any)?.coverImage as string | undefined;
  const tagline         = (hero?.content as any)?.tagline as string | undefined;
  const ctaPrimary      = (hero?.content as any)?.ctaPrimary as string | undefined;
  const ctaSecond       = (hero?.content as any)?.ctaSecondary as string | undefined;
  const ctaPrimaryHref  = (hero?.content as any)?.ctaPrimaryHref as string | undefined;
  const ctaSecondHref   = (hero?.content as any)?.ctaSecondaryHref as string | undefined;
  const jobTitle        = (hero?.content as any)?.jobTitle as string | undefined;
  const photoShape      = ((hero?.content as any)?.photoShape ?? "rounded") as "circle" | "rounded" | "square";
  const photoSize       = ((hero?.content as any)?.photoSize  ?? "xl") as "sm" | "md" | "lg" | "xl";
  const heroAlign       = ((hero?.content as any)?.heroAlign ?? "left") as "left" | "center";
  const overlayOpacity  = ((hero?.content as any)?.overlayOpacity ?? 35) as number;

  const resolveHref = (raw?: string) => {
    if (!raw) return undefined;
    const s = raw.trim();
    if (!s) return undefined;
    if (/^(https?:|mailto:|tel:)/.test(s)) return s;
    if (/^[\w.+-]+@[\w-]+\.\w+$/.test(s)) return `mailto:${s}`;
    if (/^[+\d][\d\s().-]{6,}$/.test(s)) return `tel:${s.replace(/\s/g, "")}`;
    return `https://${s}`;
  };

  const avatarSizeClass  = { sm: "w-16 h-16", md: "w-20 h-20", lg: "w-24 h-24", xl: "w-28 h-28" }[photoSize];
  const avatarShapeClass = { circle: "rounded-full", rounded: "rounded-2xl", square: "rounded-lg" }[photoShape];

  const initials = (user.name ?? user.username)
    .split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  const MAIN_SECTION_TYPES = new Set(["about", "skills", "projects", "gallery", "showreel", "timeline", "testimonials", "contact"]);
  const productsVisible = settings.showProducts !== false;
  // Only use the narrow 2-col layout when there's substantial sidebar content (products or campaigns).
  // Bio fallback and CTA-only cases don't justify shrinking the main column.
  const hasSidebar = campaigns.length > 0 || (products.length > 0 && productsVisible);

  const renderMainSection = (section: Section): React.ReactNode => {
    switch (section.type) {
      case "about": {
        if (!(section.content as any).bio) return null;
        return (
          <motion.section
            id="section-about"
            ref={el => { sectionRefs.current["about"] = el; }}
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={eFadeUp}
          >
            <SectionHeading label="About" color={color} dark={theme.dark} align={titleAlign} />
            <p className={`text-base leading-8 ${titleAlign === "center" ? "text-center" : ""}`} style={{ color: theme.dark ? "rgba(255,255,255,0.7)" : "#374151" }}>
              {(section.content as any).bio}
            </p>
          </motion.section>
        );
      }
      case "skills": {
        const items: string[] = (section.content as any).items ?? [];
        const displayStyle: string = (section.content as any).displayStyle ?? "tags";
        if (!items.length) return null;
        return (
          <motion.section
            id="section-skills"
            ref={el => { sectionRefs.current["skills"] = el; }}
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={eStagger}
          >
            <SectionHeading label="Skills" color={color} dark={theme.dark} align={titleAlign} />
            {displayStyle === "bars" ? (
              <motion.div className="space-y-2.5">
                {items.map(skill => (
                  <motion.div key={skill} variants={eFadeUp}>
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: theme.text }}>{skill}</span>
                    </div>
                    <div className="h-1.5 rounded-full w-full" style={{ background: `${color}25` }}>
                      <div className="h-full rounded-full" style={{ width: "100%", background: color }} />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : displayStyle === "minimal" ? (
              <motion.p variants={eFadeUp} className="text-base leading-8" style={{ color: theme.dark ? "rgba(255,255,255,0.6)" : "#6b7280" }}>
                {items.join(" · ")}
              </motion.p>
            ) : (
              <motion.div className={`flex flex-wrap gap-2.5 ${titleAlign === "center" ? "justify-center" : ""}`}>
                {items.map(skill => <SkillTag key={skill} skill={skill} color={color} />)}
              </motion.div>
            )}
          </motion.section>
        );
      }
      case "projects": {
        const items: any[] = (section.content as any).items ?? [];
        if (!items.length) return null;
        const pLayout    = (section.content as any).layout    ?? "grid";
        const pColumns   = (section.content as any).columns   ?? 3;
        const pCardStyle = (section.content as any).cardStyle ?? "shadow";
        const colClass   = pColumns === 2 ? "sm:grid-cols-2" : pColumns === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
        return (
          <motion.section
            id="section-projects"
            ref={el => { sectionRefs.current["projects"] = el; }}
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={eStagger}
          >
            <SectionHeading label="Featured Work" color={color} dark={theme.dark} align={titleAlign} />
            {pLayout === "list" ? (
              <motion.div className="space-y-3">
                {items.map((p: any, i: number) => (
                  <motion.div key={i} variants={eFadeUp} className="flex gap-4 p-4 rounded-2xl transition-all hover:shadow-md"
                    style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
                    {p.image && !toEmbedUrl(p.image) && !isVideoFile(p.image) && (
                      <img src={p.image} alt={p.title} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" style={{ objectPosition: p.imagePosition ?? "center" }} />
                    )}
                    <div className="flex-1 min-w-0">
                      {p.type && <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color }}>{p.type}</div>}
                      <div className="font-semibold" style={{ color: theme.text }}>{p.title}</div>
                      {p.description && <p className="text-sm mt-1 leading-relaxed" style={{ color: theme.muted }}>{p.description}</p>}
                      {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-sm font-medium" style={{ color }}><ArrowUpRight className="w-3.5 h-3.5" />View project</a>}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : pLayout === "masonry" ? (
              <motion.div style={{ columnCount: pColumns, columnGap: "16px" }} className="[&>*]:break-inside-avoid [&>*]:mb-4">
                {items.map((p: any, i: number) => <ProjectCard key={i} p={p} color={color} dark={theme.dark} cardStyle={pCardStyle} />)}
              </motion.div>
            ) : (
              <motion.div className={`grid grid-cols-1 ${colClass} gap-4`}>
                {items.map((p: any, i: number) => <ProjectCard key={i} p={p} color={color} dark={theme.dark} cardStyle={pCardStyle} />)}
              </motion.div>
            )}
          </motion.section>
        );
      }
      case "gallery": {
        const items: any[] = (section.content as any).items ?? [];
        if (!items.length) return null;
        const gLayout      = (section.content as any).layout      ?? "grid";
        const gColumns     = (section.content as any).columns      ?? 3;
        const gImageHeight = (section.content as any).imageHeight  ?? "square";

        const colClass    = gColumns === 1 ? "grid-cols-1" : gColumns === 2 ? "grid-cols-2" : gColumns === 4 ? "grid-cols-4" : "grid-cols-3";
        const heightClass = gImageHeight === "short" ? "h-32" : gImageHeight === "tall" ? "h-64" : "aspect-square";
        // Static lookup prevents Tailwind from purging these classes
        const videoColSpan = gColumns === 2 ? "col-span-2" : gColumns === 4 ? "col-span-4" : "col-span-3";

        const renderGalleryItem = (it: any, i: number) => {
          const ytThumb = it.type === "youtube" ? youtubeThumb(it.url) : null;
          const isVid = it.type === "video";
          return (
            <motion.div
              key={i} variants={eFadeUp}
              className={`group relative rounded-xl overflow-hidden cursor-pointer ${isVid && gLayout !== "masonry" && gLayout !== "row" ? videoColSpan : ""}`}
              style={{ background: theme.dark ? "rgba(255,255,255,0.05)" : "#f3f4f6" }}
              onClick={() => !isVid && setLightbox({ items, index: i })}
            >
              <div className={isVid ? "w-full" : gLayout === "masonry" ? "w-full" : heightClass}>
                {ytThumb ? (
                  <>
                    <img src={ytThumb} alt={it.caption ?? ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-all">
                      <div className="w-11 h-11 rounded-full bg-red-600/90 flex items-center justify-center shadow-xl">
                        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                  </>
                ) : isVid ? (
                  <div onClick={e => e.stopPropagation()}>
                    <video src={it.url} className="w-full" controls preload="metadata" playsInline />
                  </div>
                ) : (
                  <>
                    <img src={it.url} alt={it.caption ?? ""} className="w-full object-cover group-hover:scale-105 transition-transform duration-500" style={gLayout === "masonry" ? undefined : { height: "100%" }} />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                  </>
                )}
              </div>
              {it.caption && !isVid && (
                <div className="absolute inset-x-0 bottom-0 px-2 py-2 bg-gradient-to-t from-black/70 text-white text-[11px] opacity-0 group-hover:opacity-100 transition-opacity truncate">
                  {it.caption}
                </div>
              )}
            </motion.div>
          );
        };

        return (
          <motion.section
            id="section-gallery"
            ref={el => { sectionRefs.current["gallery"] = el; }}
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={eStagger}
          >
            <SectionHeading label="Gallery" color={color} dark={theme.dark} align={titleAlign} />
            {gLayout === "masonry" ? (
              <motion.div
                style={{ columnCount: gColumns, columnGap: "8px" }}
                className="[&>*]:break-inside-avoid [&>*]:mb-2"
              >
                {items.map((it: any, i: number) => renderGalleryItem(it, i))}
              </motion.div>
            ) : gLayout === "row" ? (
              <motion.div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                {items.map((it: any, i: number) => (
                  <motion.div
                    key={i} variants={eFadeUp}
                    className="flex-shrink-0 w-44 rounded-xl overflow-hidden cursor-pointer group relative"
                    style={{
                      height: gImageHeight === "short" ? "112px" : gImageHeight === "tall" ? "220px" : "176px",
                      background: theme.dark ? "rgba(255,255,255,0.05)" : "#f3f4f6",
                    }}
                    onClick={() => it.type !== "video" && setLightbox({ items, index: i })}
                  >
                    {it.type === "youtube" ? (
                      <img src={youtubeThumb(it.url) ?? ""} alt={it.caption ?? ""} className="w-full h-full object-cover" />
                    ) : it.type === "video" ? (
                      <video src={it.url} className="w-full h-full object-cover" muted playsInline />
                    ) : (
                      <img src={it.url} alt={it.caption ?? ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div className={`grid ${colClass} gap-2`}>
                {items.map((it: any, i: number) => renderGalleryItem(it, i))}
              </motion.div>
            )}
          </motion.section>
        );
      }
      case "timeline": {
        const items: any[] = (section.content as any).items ?? [];
        const tlStyle: string = (section.content as any).style ?? "line";
        if (!items.length) return null;
        return (
          <motion.section
            id="section-timeline"
            ref={el => { sectionRefs.current["timeline"] = el; }}
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={eStagger}
          >
            <SectionHeading label="Experience" color={color} dark={theme.dark} align={titleAlign} />
            {tlStyle === "blocks" ? (
              <motion.div className="grid sm:grid-cols-2 gap-4">
                {items.map((e: any, i: number) => (
                  <motion.div key={i} variants={eFadeUp} className="p-5 rounded-2xl" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
                    <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color }}>{e.year}</div>
                    <div className="font-semibold text-base mb-0.5" style={{ color: theme.text }}>{e.title}</div>
                    {e.company && <div className="text-sm mb-2" style={{ color: theme.muted }}>{e.company}</div>}
                    {e.description && <p className="text-sm leading-relaxed" style={{ color: theme.muted }}>{e.description}</p>}
                  </motion.div>
                ))}
              </motion.div>
            ) : tlStyle === "dots" ? (
              <motion.div className="space-y-6">
                {items.map((e: any, i: number) => (
                  <motion.div key={i} variants={eFadeUp} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1" style={{ background: color }} />
                    </div>
                    <div className="pb-6">
                      <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color }}>{e.year}</div>
                      <div className="font-semibold text-base mb-0.5" style={{ color: theme.text }}>{e.title}</div>
                      {e.company && <div className="text-sm mb-1.5" style={{ color: theme.muted }}>{e.company}</div>}
                      {e.description && <p className="text-sm leading-relaxed" style={{ color: theme.muted }}>{e.description}</p>}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div className="relative pl-6" style={{ borderLeft: `2px solid ${color}30` }}>
                {items.map((e: any, i: number) => (
                  <motion.div key={i} variants={eFadeUp} className="relative mb-8 last:mb-0">
                    <div className="absolute -left-[29px] w-3.5 h-3.5 rounded-full border-2 border-white shadow" style={{ background: color }} />
                    <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color }}>{e.year}</div>
                    <div className="font-semibold text-base mb-0.5" style={{ color: theme.text }}>{e.title}</div>
                    {e.company && <div className="text-sm mb-1.5" style={{ color: theme.muted }}>{e.company}</div>}
                    {e.description && <p className="text-sm leading-relaxed" style={{ color: theme.dark ? "rgba(255,255,255,0.5)" : "#6b7280" }}>{e.description}</p>}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.section>
        );
      }
      case "testimonials": {
        const items: any[] = (section.content as any).items ?? [];
        const tLayout: string = (section.content as any).layout ?? "cards";
        if (!items.length) return null;
        const renderStars = (rating: number) => (
          <div className="flex gap-0.5 mb-3">
            {[1,2,3,4,5].map(s => (
              <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
            ))}
          </div>
        );
        return (
          <motion.section
            id="section-testimonials"
            ref={el => { sectionRefs.current["testimonials"] = el; }}
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={eStagger}
          >
            <SectionHeading label="What People Say" color={color} dark={theme.dark} align={titleAlign} />
            {tLayout === "quotes" ? (
              <motion.div className="space-y-8">
                {items.map((t: any, i: number) => (
                  <motion.div key={i} variants={eFadeUp} className="text-center">
                    {renderStars(t.rating ?? 5)}
                    <p className="text-xl font-medium leading-8 mb-4" style={{ color: theme.text }}>
                      &ldquo;{t.text}&rdquo;
                    </p>
                    <div className="text-sm font-semibold" style={{ color }}>{t.author}</div>
                    {t.role && <div className="text-xs mt-0.5" style={{ color: theme.muted }}>{t.role}</div>}
                  </motion.div>
                ))}
              </motion.div>
            ) : tLayout === "minimal" ? (
              <motion.div className="space-y-5">
                {items.map((t: any, i: number) => (
                  <motion.div key={i} variants={eFadeUp}>
                    <p className="text-sm leading-7 italic mb-2" style={{ color: theme.dark ? "rgba(255,255,255,0.65)" : "#374151" }}>
                      &ldquo;{t.text}&rdquo;
                    </p>
                    <div className="text-sm font-semibold" style={{ color: theme.text }}>
                      — {t.author}{t.role ? `, ${t.role}` : ""}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div className="space-y-4">
                {items.map((t: any, i: number) => (
                  <motion.div key={i} variants={eFadeUp} className="p-5 rounded-2xl" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
                    {renderStars(t.rating ?? 5)}
                    <p className="text-sm leading-7 mb-4" style={{ color: theme.dark ? "rgba(255,255,255,0.65)" : "#374151" }}>
                      &ldquo;{t.text}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: color }}>
                        {(t.author ?? "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold" style={{ color: theme.text }}>{t.author}</div>
                        {t.role && <div className="text-xs" style={{ color: theme.muted }}>{t.role}</div>}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.section>
        );
      }
      case "showreel": {
        const rawReels: any[] = (section.content as any).reels ?? [];
        if (!rawReels.length) return null;
        const srLayout      = (section.content as any).layout      ?? "single";
        const srAspectRatio = (section.content as any).aspectRatio ?? "16:9";
        const aspectClass   = srAspectRatio === "4:3" ? "aspect-[4/3]" : srAspectRatio === "portrait" ? "aspect-[9/16] max-w-xs mx-auto" : "aspect-video";
        const gridClass     = srLayout === "3-columns" ? "grid grid-cols-1 sm:grid-cols-3 gap-4" : srLayout === "side-by-side" ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "space-y-6";

        return (
          <motion.section
            id="section-showreel"
            ref={el => { sectionRefs.current["showreel"] = el; }}
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={eStagger}
          >
            <SectionHeading label="Showreel" color={color} dark={theme.dark} align={titleAlign} />
            <motion.div className={gridClass}>
              {rawReels.map((reel: any, i: number) => {
                // Support both plain string URLs and { url, title } objects
                const url      = typeof reel === "string" ? reel : (reel.url ?? "");
                const title    = typeof reel === "object" ? reel.title as string | undefined : undefined;
                const embedUrl = toEmbedUrl(url);
                if (!embedUrl) return null;
                return (
                  <motion.div key={i} variants={eFadeUp} className="rounded-2xl overflow-hidden" style={{ background: theme.dark ? "rgba(255,255,255,0.05)" : "#f3f4f6", border: `1px solid ${theme.border}` }}>
                    <div className={aspectClass}>
                      <iframe
                        src={embedUrl}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                      />
                    </div>
                    {title && (
                      <div className="px-4 py-3 text-sm font-semibold" style={{ color: theme.text }}>{title}</div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.section>
        );
      }
      case "contact": {
        const c = section.content as any;
        if (!c.email && !c.message) return null;
        return (
          <motion.section
            id="section-contact"
            ref={el => { sectionRefs.current["contact"] = el; }}
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
            variants={eFadeUp}
            className="p-8 rounded-2xl text-center"
            style={{ background: `${color}12`, border: `1px solid ${color}25` }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: color }}>
              <Mail className="w-5 h-5 text-white" />
            </div>
            {c.message && <h3 className="text-xl font-bold mb-2" style={{ color: theme.text }}>{c.message}</h3>}
            {c.email && (
              <a
                href={`mailto:${c.email}`}
                className={`inline-flex items-center gap-2 mt-3 px-6 py-3 ${btnRadius} text-white font-semibold text-sm transition-all hover:opacity-90 hover:shadow-lg`}
                style={{ background: color }}
              >
                <Mail className="w-4 h-4" />
                {c.email}
              </a>
            )}
            {c.showForm !== false && c.email && (
              <ContactForm email={c.email} color={color} dark={theme.dark} />
            )}
          </motion.section>
        );
      }
      case "store": {
        if (!products.length || !productsVisible) return null;
        return (
          <motion.section
            id="section-store"
            ref={el => { sectionRefs.current["store"] = el; }}
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={eStagger}
          >
            <SectionHeading label="Shop" color={color} dark={theme.dark} align={titleAlign} />
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.slice(0, 3).map((p, i) => (
                <motion.div key={p.id} variants={eFadeUp}
                  className="group rounded-2xl overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5"
                  style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
                  <div className="aspect-square overflow-hidden bg-gray-100">
                    {p.images[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: `${color}10` }}>
                        {p.type === "DIGITAL" ? <Download className="w-10 h-10 opacity-40" style={{ color }} /> : p.type === "SERVICE" ? <Briefcase className="w-10 h-10 opacity-40" style={{ color }} /> : p.type === "SUBSCRIPTION" ? <RefreshCw className="w-10 h-10 opacity-40" style={{ color }} /> : <Package className="w-10 h-10 opacity-40" style={{ color }} />}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color }}>
                      {p.type.charAt(0) + p.type.slice(1).toLowerCase()}
                    </div>
                    <div className="font-semibold text-sm mb-1" style={{ color: theme.text }}>{p.name}</div>
                    {p.description && (
                      <p className="text-xs line-clamp-2 mb-2" style={{ color: theme.muted }}>{p.description}</p>
                    )}
                    <div className="font-black text-base" style={{ color }}>{formatCurrency(p.price)}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            <motion.div variants={eFadeUp} className="mt-6 text-center">
              <Link
                href={`/${user.username}/store`}
                className={`inline-flex items-center gap-2 px-6 py-2.5 ${btnRadius} text-white text-sm font-semibold transition-opacity hover:opacity-90`}
                style={{ background: color }}
              >
                Visit Store →
              </Link>
            </motion.div>
          </motion.section>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div style={{ background: theme.bg, color: theme.text, fontFamily: fontCss }} className="min-h-screen">

      {/* Owner draft banner */}
      {isOwner && !portfolio?.published && (
        <div className="sticky top-0 z-50 flex items-center justify-between gap-3 px-4 py-2.5 bg-amber-50 border-b border-amber-200">
          <div className="flex items-center gap-2">
            <EyeOff className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span className="text-amber-800 text-xs font-medium">
              Draft preview — this page is not visible to others yet.
            </span>
          </div>
          <Link href="/portfolio" className="text-xs font-semibold text-amber-800 underline underline-offset-2 hover:text-amber-900 whitespace-nowrap">
            Publish now →
          </Link>
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Cover */}
        <div className={`${heroHeightClass} relative`}>
          {coverImage ? (
            <>
              <img src={coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${overlayOpacity / 100})` }} />
            </>
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: theme.dark
                  ? `linear-gradient(135deg, ${color}44 0%, ${color}22 50%, transparent 100%)`
                  : `linear-gradient(135deg, ${color}cc 0%, ${color}88 50%, ${color}33 100%)`,
              }}
            >
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
            </div>
          )}
        </div>

        {/* Profile card */}
        <div className={`${pageWidthClass} mx-auto px-4 sm:px-6`}>
          <div className={`relative -mt-16 mb-5 flex gap-4 ${heroAlign === "center" ? "flex-col items-center text-center" : "flex-col sm:flex-row sm:items-end"}`}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex-shrink-0"
            >
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name ?? user.username}
                  className={`${avatarSizeClass} ${avatarShapeClass} object-cover shadow-2xl`}
                  style={{ border: `4px solid ${theme.bg}` }}
                />
              ) : (
                <div
                  className={`${avatarSizeClass} ${avatarShapeClass} shadow-2xl flex items-center justify-center text-white text-3xl font-bold`}
                  style={{ background: `linear-gradient(135deg, ${color}, ${color}99)`, border: `4px solid ${theme.bg}` }}
                >
                  {initials}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.18 }}
              className="flex-1 sm:pb-2 min-w-0"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold" style={{ color: theme.text }}>
                  {user.name ?? user.username}
                </h1>
                {user.verified && <CheckCircle className="w-5 h-5 text-[#2e9cfe]" />}
              </div>
              {jobTitle && (
                <p className="text-sm font-semibold mt-0.5" style={{ color }}>
                  {jobTitle}
                </p>
              )}
              <p className="text-sm mt-0.5" style={{ color: theme.muted }}>
                @{user.username}{tagline ? ` · ${tagline}` : ""}
              </p>
            </motion.div>

            {/* Action buttons */}
            {!isOwner && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.24 }}
                className="flex items-center gap-2 sm:pb-2"
              >
                <button
                  onClick={handleShare}
                  title={shareMsg ?? "Share"}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                  style={{ background: theme.surface, border: `1px solid ${theme.border}`, color: shareMsg ? color : theme.muted }}
                >
                  {shareMsg ? <Link2 className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
                  style={
                    isFollowing
                      ? { background: theme.surface, border: `1px solid ${theme.border}`, color: theme.text }
                      : { background: color, color: "#ffffff" }
                  }
                >
                  <Heart className={`w-4 h-4 ${isFollowing ? "fill-current" : ""}`} />
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </motion.div>
            )}
            {isOwner && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="sm:pb-2"
              >
                <Link
                  href="/portfolio"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{ background: theme.surface, border: `1px solid ${theme.border}`, color: theme.muted }}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit portfolio
                </Link>
              </motion.div>
            )}
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className={`flex items-center gap-6 mb-4 text-sm ${heroAlign === "center" ? "justify-center" : ""}`}
          >
            <div>
              <span className="font-bold" style={{ color: theme.text }}>{followCount.toLocaleString()}</span>
              <span className="ml-1" style={{ color: theme.muted }}>followers</span>
            </div>
            <div>
              <span className="font-bold" style={{ color: theme.text }}>{user._count.following.toLocaleString()}</span>
              <span className="ml-1" style={{ color: theme.muted }}>following</span>
            </div>
            {products.length > 0 && (
              <div>
                <span className="font-bold" style={{ color: theme.text }}>{products.length}</span>
                <span className="ml-1" style={{ color: theme.muted }}>products</span>
              </div>
            )}
          </motion.div>

          {/* Social links */}
          {(() => {
            const social = (hero?.content as any)?.social ?? {};
            const links = Object.entries(social).filter(([, v]) => v) as [string, string][];
            if (links.length === 0) return null;
            const icons: Record<string, string> = {
              twitter: "𝕏", instagram: "IG", linkedin: "in", youtube: "YT", website: "Web",
            };
            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className={`flex items-center gap-2 mb-6 flex-wrap ${heroAlign === "center" ? "justify-center" : ""}`}
              >
                {links.map(([key, url]) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                    style={{ background: theme.surface, border: `1px solid ${theme.border}`, color: theme.muted }}
                  >
                    <span>{icons[key] ?? <Globe className="w-3 h-3" />}</span>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </a>
                ))}
              </motion.div>
            );
          })()}
          {/* CTA buttons */}
          {(ctaPrimary || ctaSecond) && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`flex items-center gap-3 flex-wrap mb-2 ${heroAlign === "center" ? "justify-center" : ""}`}
            >
              {ctaPrimary && (() => {
                const href = resolveHref(ctaPrimaryHref);
                const cls = `inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold transition-all hover:opacity-90 ${btnRadius}`;
                const style = { background: color, color: "#fff" };
                return href
                  ? <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className={cls} style={style}>{ctaPrimary}</a>
                  : <span className={cls} style={style}>{ctaPrimary}</span>;
              })()}
              {ctaSecond && (() => {
                const href = resolveHref(ctaSecondHref);
                const cls = `inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold transition-all hover:opacity-80 ${btnRadius}`;
                const style = { background: theme.surface, border: `1px solid ${theme.border}`, color: theme.text };
                return href
                  ? <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className={cls} style={style}>{ctaSecond}</a>
                  : <span className={cls} style={style}>{ctaSecond}</span>;
              })()}
            </motion.div>
          )}
        </div>
      </section>

      {/* Sticky section nav */}
      {navSections.length > 1 && (settings.navStyle ?? "tabs") !== "hidden" && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="sticky top-0 z-40 border-b"
          style={{ background: theme.dark ? `${theme.bg}ee` : `${theme.bg}f0`, backdropFilter: "blur(12px)", borderColor: theme.border }}
        >
          <div className={`${pageWidthClass} mx-auto px-4 sm:px-6`}>
            <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar py-1">
              {navSections.map(s => {
                const isActive = activeSection === `section-${s.type}`;
                const navStyle = settings.navStyle ?? "tabs";
                const btnStyle =
                  navStyle === "pills"
                    ? isActive
                      ? { color: "#fff", background: color }
                      : { color: theme.muted, background: "transparent" }
                    : navStyle === "minimal"
                    ? isActive
                      ? { color, borderBottom: `2px solid ${color}` }
                      : { color: theme.muted, borderBottom: "2px solid transparent" }
                    : isActive
                    ? { color, background: `${color}15` }
                    : { color: theme.muted };
                const btnClass =
                  navStyle === "pills"
                    ? "px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0"
                    : navStyle === "minimal"
                    ? "px-3 pb-2 pt-2 text-sm font-medium whitespace-nowrap transition-all flex-shrink-0"
                    : "px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0";
                return (
                  <button key={s.type} onClick={() => scrollTo(s.type)} className={btnClass} style={btnStyle}>
                    {NAV_LABELS[s.type]}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Main content */}
      <div className={`${pageWidthClass} mx-auto px-4 sm:px-6 pb-20`}>
        <div className="mt-8">

          {/* Sidebar floats right — sections wrap around it and expand below once it ends */}
          {hasSidebar && (
            <div className="md:float-right md:ml-10 md:w-[300px] space-y-5 mb-8">

              {/* Active campaigns */}
              {campaigns.length > 0 && (
                <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={eStagger}>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: theme.text }}>Active Campaigns</h3>
                  <motion.div className="space-y-3">
                    {campaigns.map(c => {
                      const pct = Math.min(Math.round((c.raised / c.goal) * 100), 100);
                      return (
                        <motion.div
                          key={c.id} variants={eFadeUp}
                          className="p-4 rounded-2xl transition-all hover:shadow-lg"
                          style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
                        >
                          <div className="text-sm font-semibold mb-2.5" style={{ color: theme.text }}>{c.title}</div>
                          <Progress value={pct} className="h-1.5 mb-2" />
                          <div className="flex justify-between text-xs mb-3">
                            <span className="text-emerald-500 font-semibold">{formatCurrency(c.raised)} raised</span>
                            <span className="font-semibold" style={{ color }}>{pct}%</span>
                          </div>
                          <button className="w-full py-2 rounded-xl text-white text-xs font-semibold transition-all hover:opacity-90" style={{ background: color }}>
                            Back this project
                          </button>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </motion.section>
              )}

              {/* Products */}
              {products.length > 0 && productsVisible && (
                <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={eStagger}>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: theme.text }}>Products</h3>
                  <motion.div className="space-y-2">
                    {products.map(p => (
                      <motion.div
                        key={p.id} variants={eFadeUp}
                        className="flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all hover:shadow-md"
                        style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
                          {p.type === "DIGITAL" ? <Download className="w-4 h-4" style={{ color }} /> : p.type === "SERVICE" ? <Briefcase className="w-4 h-4" style={{ color }} /> : <Package className="w-4 h-4" style={{ color }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate" style={{ color: theme.text }}>{p.name}</div>
                          <div className="text-xs capitalize" style={{ color: theme.muted }}>{p.type.toLowerCase()}</div>
                        </div>
                        <span className="text-sm font-bold text-emerald-500">{formatCurrency(p.price)}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.section>
              )}

            </div>
          )}

          {/* Main sections — flow around the sidebar; expand full-width once sidebar ends */}
          <div className={spacingClass}>
            {visible
              .filter(s => MAIN_SECTION_TYPES.has(s.type))
              .map(section => (
                <React.Fragment key={section.id}>
                  {renderMainSection(section)}
                </React.Fragment>
              ))}
          </div>
          <div className="clear-both" />
        </div>
      </div>

      {/* Footer badge */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="pb-10 flex justify-center"
      >
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all hover:opacity-80"
          style={{
            background: theme.dark ? "rgba(255,255,255,0.07)" : "#f3f4f6",
            color: theme.muted,
            border: `1px solid ${theme.border}`,
          }}
        >
          <Globe className="w-3 h-3" />
          Built with Sellora
        </Link>
      </motion.div>

      {/* Gallery lightbox */}
      <AnimatePresence>
        {lightbox && (
          <GalleryLightbox
            items={lightbox.items}
            index={lightbox.index}
            onClose={() => setLightbox(null)}
            onPrev={() => setLightbox(l => l ? { ...l, index: l.index - 1 } : null)}
            onNext={() => setLightbox(l => l ? { ...l, index: l.index + 1 } : null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ label, color, dark, align = "left" }: { label: string; color: string; dark: boolean; align?: "left" | "center" }) {
  if (align === "center") {
    return (
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold inline-block" style={{ color: dark ? "#f0f4f8" : "#111827" }}>{label}</h2>
        <div className="mx-auto mt-2 w-12 h-0.5 rounded-full" style={{ background: color }} />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 mb-6">
      <h2 className="text-xl font-bold" style={{ color: dark ? "#f0f4f8" : "#111827" }}>
        {label}
      </h2>
      <div className="flex-1 h-px" style={{ background: `${color}25` }} />
    </div>
  );
}
