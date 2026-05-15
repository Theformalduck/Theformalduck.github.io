"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Sparkles, Eye, Share2, Palette, Plus, ExternalLink,
  GitBranch, ArrowLeft, Check, X, Layers, Monitor, Smartphone,
  Zap, Save, Trash2, Mail, AtSign, Link2, Edit3, ChevronRight,
  ImagePlus, Camera, Film, Image as ImageIcon, ChevronUp, ChevronDown, Crown,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/DashboardSidebar";
import { PRESETS, FONTS, getPreset, cardBg, cardFilter, pageBackground, type Preset } from "@/lib/presets";

const uid = () => Math.random().toString(36).slice(2, 9);

/* ── Core types ── */
interface Project    { id: string; name: string; desc: string; tags: string; link: string; stars: number; image?: string }
interface SkillGroup { id: string; category: string; items: string[] }
interface ExpEntry   { id: string; role: string; company: string; period: string; desc: string }
interface Testimonial{ id: string; quote: string; name: string; jobTitle: string }

/* ── Block types ── */
interface GalleryImage { id: string; src: string; caption: string }
interface ServiceItem  { id: string; name: string; desc: string; price: string }
interface AwardItem    { id: string; title: string; org: string; year: string }
interface PressItem    { id: string; publication: string; headline: string; url: string; year: string }

interface VideoItem { id: string; url: string; caption: string }
type VideoBlock    = { id: string; type: "video";    title: string; items: VideoItem[]; columns?: 1|2|3; width?: "sm"|"md"|"lg"|"full"; align?: "left"|"center"|"right"; aspect?: "16:9"|"4:3"|"1:1" }
type GalleryBlock  = { id: string; type: "gallery";  title: string; images: GalleryImage[]; layout: "grid"|"masonry"|"row"; columns?: 1|2|3|4; imageHeight?: "short"|"square"|"tall"; gap?: "sm"|"md"|"lg" }
interface ReelItem { id: string; url: string }
type ReelBlock     = { id: string; type: "reel";     title: string; items: ReelItem[]; columns?: 1|2|3; width?: "md"|"lg"|"full"; aspect?: "16:9"|"4:3"|"9:16" }
type ServicesBlock = { id: string; type: "services"; title: string; items: ServiceItem[] }
type AwardsBlock   = { id: string; type: "awards";   title: string; items: AwardItem[] }
type PressBlock    = { id: string; type: "press";    title: string; items: PressItem[] }
type CustomBlock   = VideoBlock | GalleryBlock | ReelBlock | ServicesBlock | AwardsBlock | PressBlock

interface PortfolioData {
  portfolioType: string;
  name: string; initials: string; title: string; bio: string;
  email: string; github: string; linkedin: string; twitter: string;
  photo?: string; photoSize?: "sm"|"md"|"lg"|"xl"; photoShape?: "circle"|"rounded"|"square";
  accentColor?: string; font?: string;
  projectLayout?: "grid" | "list";
  projects: Project[];
  skills: SkillGroup[];
  experience: ExpEntry[];
  testimonials: Testimonial[];
  customBlocks: CustomBlock[];
  sectionOrder: string[];
}

/* ── Constants ── */
const BUILT_IN = ["hero","projects","skills","experience","testimonials","contact"];


type PortfolioTypeDef = { label: string; icon: string; desc: string; defaultOrder: string[]; defaultBlocks: CustomBlock[] }

const PORTFOLIO_TYPES: Record<string, PortfolioTypeDef> = {
  developer: {
    label: "Developer", icon: "💻", desc: "Projects, skills, open source",
    defaultOrder: ["hero","projects","skills","experience","contact"],
    defaultBlocks: [],
  },
  photographer: {
    label: "Photographer", icon: "📷", desc: "Gallery-first visual portfolio",
    defaultOrder: ["hero","__gallery__","__services__","testimonials","contact"],
    defaultBlocks: [
      { id: "__gallery__",  type: "gallery",  title: "Portfolio",  images: [], layout: "masonry" },
      { id: "__services__", type: "services", title: "Services",   items: [
        { id: uid(), name: "Portrait Session",   desc: "2-hour studio or outdoor shoot", price: "$250" },
        { id: uid(), name: "Event Photography",  desc: "Full-day coverage with edited gallery", price: "$800" },
      ]},
    ],
  },
  actor: {
    label: "Actor / Talent", icon: "🎭", desc: "Reel, headshots, credits",
    defaultOrder: ["hero","__reel__","__gallery__","experience","contact"],
    defaultBlocks: [
      { id: "__reel__",    type: "reel",    title: "Showreel",  items: [] },
      { id: "__gallery__", type: "gallery", title: "Headshots", images: [], layout: "grid" },
    ],
  },
  editor: {
    label: "Video Editor", icon: "🎬", desc: "Demo reels and project breakdowns",
    defaultOrder: ["hero","__reel__","projects","skills","contact"],
    defaultBlocks: [
      { id: "__reel__", type: "reel", title: "Demo Reel", items: [] },
    ],
  },
  designer: {
    label: "Designer", icon: "🎨", desc: "Case studies and visual work",
    defaultOrder: ["hero","__gallery__","projects","skills","testimonials","contact"],
    defaultBlocks: [
      { id: "__gallery__", type: "gallery", title: "Selected Work", images: [], layout: "masonry" },
    ],
  },
  writer: {
    label: "Writer", icon: "✍️", desc: "Articles, bylines, press features",
    defaultOrder: ["hero","__press__","experience","testimonials","contact"],
    defaultBlocks: [
      { id: "__press__", type: "press", title: "Published In", items: [] },
    ],
  },
  musician: {
    label: "Musician / Artist", icon: "🎵", desc: "Music videos, releases, photos",
    defaultOrder: ["hero","__reel__","__video__","__gallery__","contact"],
    defaultBlocks: [
      { id: "__reel__",    type: "reel",    title: "Latest Release", items: [] },
      { id: "__video__",   type: "video",   title: "Music Video",    items: [{ id: "__v1__", url: "", caption: "" }] },
      { id: "__gallery__", type: "gallery", title: "Photos",          images: [], layout: "grid" },
    ],
  },
};

const BLOCK_CATALOG = [
  { type: "video"    as const, label: "Video Embed",        icon: "🎥", desc: "YouTube or Vimeo" },
  { type: "gallery"  as const, label: "Photo Gallery",      icon: "🖼️", desc: "Grid or masonry" },
  { type: "reel"     as const, label: "Showreel",           icon: "🎬", desc: "Featured video player" },
  { type: "services" as const, label: "Services",           icon: "💼", desc: "Offerings + pricing" },
  { type: "awards"   as const, label: "Awards & Credits",   icon: "🏆", desc: "Recognition and credits" },
  { type: "press"    as const, label: "Press",              icon: "📰", desc: "Where you've been featured" },
];

const SECTION_META: Record<string, { label: string; icon: string }> = {
  hero:         { label: "Hero / About",  icon: "👤" },
  projects:     { label: "Projects",      icon: "🚀" },
  skills:       { label: "Skills",        icon: "⚡" },
  experience:   { label: "Experience",    icon: "💼" },
  testimonials: { label: "Testimonials",  icon: "💬" },
  contact:      { label: "Contact",       icon: "📬" },
};

/* ── Helpers ── */
function toEmbedUrl(url: string): string {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0`;
  const vim = url.match(/vimeo\.com\/(\d+)/);
  if (vim) return `https://player.vimeo.com/video/${vim[1]}`;
  return url;
}

function makeBlock(type: CustomBlock["type"]): CustomBlock {
  const id = uid();
  switch (type) {
    case "video":    return { id, type, title: "Featured Video", items: [{ id: uid(), url: "", caption: "" }], columns: 1 };
    case "gallery":  return { id, type, title: "Gallery", images: [], layout: "grid" };
    case "reel":     return { id, type, title: "Showreel", items: [{ id: uid(), url: "" }], columns: 1 };
    case "services": return { id, type, title: "Services", items: [] };
    case "awards":   return { id, type, title: "Awards & Recognition", items: [] };
    case "press":    return { id, type, title: "Press", items: [] };
  }
}

/* ── Default data ── */
const DEFAULT: PortfolioData = {
  portfolioType: "developer",
  name: "John Doe", initials: "JD", title: "Senior Frontend Engineer",
  bio: "Building high-performance web applications with React and TypeScript. Open to exciting opportunities.",
  email: "john@example.com", github: "github.com/johndoe",
  linkedin: "linkedin.com/in/johndoe", twitter: "@johndoe",
  projects: [
    { id: uid(), name: "AI Analytics Dashboard", desc: "Real-time data viz platform serving 50+ enterprise clients.", tags: "React, D3.js, Node.js", link: "github.com/johndoe/analytics", stars: 234 },
    { id: uid(), name: "Open-Source UI Library", desc: "40+ accessible React components. 2K+ GitHub stars.", tags: "TypeScript, Storybook", link: "github.com/johndoe/ui-lib", stars: 2100 },
  ],
  skills: [
    { id: uid(), category: "Frontend", items: ["React", "TypeScript", "Next.js", "Tailwind CSS"] },
    { id: uid(), category: "Backend",  items: ["Node.js", "PostgreSQL", "Redis", "GraphQL"] },
  ],
  experience: [
    { id: uid(), role: "Senior Frontend Engineer", company: "Acme Corp", period: "Jan 2023 – Present", desc: "Led frontend architecture. Reduced load times by 60%." },
  ],
  testimonials: [
    { id: uid(), quote: "One of the best engineers I've worked with.", name: "Sarah Chen", jobTitle: "Engineering Manager @ Stripe" },
  ],
  customBlocks: [],
  sectionOrder: ["hero","projects","skills","experience","contact"],
};

/* ══════════════════════════════════════════════
   PORTFOLIO PREVIEW
══════════════════════════════════════════════ */
function PortfolioPreview({ data, preset, mobile }: {
  data: PortfolioData; preset: Preset; mobile: boolean;
}) {
  const accent = data.accentColor || preset.accent;
  const fontFamily = FONTS[data.font || preset.font] ?? FONTS.system;
  const isGrid = (data.projectLayout || "grid") === "grid";
  const tags = (str: string) => str.split(",").map(s => s.trim()).filter(Boolean);
  const blockMap = Object.fromEntries(data.customBlocks.map(b => [b.id, b]));
  const pad = mobile ? "0 20px 40px" : "0 40px 48px";
  const r = preset.radius;
  const sh = preset.shadow;
  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: cardBg(preset),
    backdropFilter: cardFilter(preset),
    WebkitBackdropFilter: cardFilter(preset),
    boxShadow: sh,
    borderRadius: r,
    border: `1px solid ${preset.border}`,
    ...extra,
  });
  const label = (txt: string) => (
    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: `${preset.text}35`, textTransform: "uppercase" as const, marginBottom: 20 }}>{txt}</p>
  );
  const photoSizePx = ({ sm: 48, md: 60, lg: 80, xl: 100 } as Record<string,number>)[data.photoSize || "md"] ?? 60;
  const photoRadius = ({ circle: "50%", rounded: Math.max(r, 16), square: 4 } as Record<string,string|number>)[data.photoShape || "rounded"] ?? Math.max(r, 16);
  const aspectPB = (a?: string) => (({ "16:9": "56.25%", "4:3": "75%", "1:1": "100%", "9:16": "177.78%" } as Record<string,string>)[a || "16:9"] ?? "56.25%");
  const vidWrapStyle = (w?: string, align?: string): React.CSSProperties => {
    if (!w || w === "full") return {};
    const widths: Record<string,string> = { sm: "50%", md: "70%", lg: "90%" };
    const margins: Record<string,string> = { left: "0 auto 0 0", center: "0 auto", right: "0 0 0 auto" };
    return { width: widths[w] ?? "100%", margin: margins[align || "center"] ?? "0 auto" };
  };
  const galCols = (block: GalleryBlock) => {
    if (mobile) return "repeat(2,1fr)";
    const n = block.columns ?? (block.layout === "row" ? 4 : 3);
    return `repeat(${n},1fr)`;
  };
  const galAspect = (h?: string) => (({ short: "4/3", square: "1/1", tall: "3/4" } as Record<string,string>)[h || "square"] ?? "1/1");
  const galGap = (g?: string) => (({ sm: 4, md: 8, lg: 16 } as Record<string,number>)[g || "md"] ?? 8);

  return (
    <div style={{ background: pageBackground(preset), minHeight: 600, color: preset.text, fontFamily }}>
      {/* Nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: mobile ? "12px 20px" : "14px 40px", borderBottom: `1px solid ${preset.border}` }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>{data.initials || data.name.split(" ").map(w => w[0]).join("") || "JD"}.</span>
        {!mobile && (
          <div style={{ display: "flex", gap: 24, fontSize: 12, color: `${preset.text}80` }}>
            {data.sectionOrder.filter(id => BUILT_IN.includes(id)).map(id => (
              <span key={id}>{id === "hero" ? "About" : id.charAt(0).toUpperCase() + id.slice(1)}</span>
            ))}
          </div>
        )}
        {data.sectionOrder.includes("contact") && (
          <a href={`mailto:${data.email}`} style={{ fontSize: 11, padding: "6px 14px", borderRadius: Math.min(r, 10), background: accent, color: preset.bg, fontWeight: 600, textDecoration: "none" }}>Hire me</a>
        )}
      </div>

      {data.sectionOrder.map(id => {
        /* ── Built-in sections ── */
        if (id === "hero") return (
          <div key="hero" style={{ textAlign: "center", padding: mobile ? "40px 20px" : "72px 40px 56px" }}>
            <div style={{ width: photoSizePx, height: photoSizePx, borderRadius: photoRadius, overflow: "hidden", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", background: data.photo ? "transparent" : `linear-gradient(135deg, ${accent}, ${accent}80)`, fontSize: 22, fontWeight: 700, color: preset.bg, flexShrink: 0 }}>
              {data.photo ? <img src={data.photo} alt={data.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (data.initials || data.name.split(" ").map(w => w[0]).join("").slice(0,2))}
            </div>
            <h1 style={{ fontSize: mobile ? 26 : 38, fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.025em" }}>{data.name}</h1>
            <p style={{ fontSize: 15, color: `${preset.text}70`, margin: "0 0 16px" }}>{data.title}</p>
            <p style={{ fontSize: 13, color: `${preset.text}50`, maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.7 }}>{data.bio}</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
              <button style={{ padding: "9px 20px", borderRadius: Math.min(r, 10), background: accent, color: preset.bg, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer" }}>View Resume</button>
              {data.sectionOrder.includes("contact") && <button style={{ padding: "9px 20px", borderRadius: Math.min(r, 10), background: "transparent", color: preset.text, fontSize: 12, fontWeight: 500, border: `1px solid ${preset.border}`, cursor: "pointer" }}>Contact me</button>}
            </div>
          </div>
        );

        if (id === "projects" && data.projects.length > 0) return (
          <div key="projects" style={{ padding: pad }}>
            {label("Featured Projects")}
            <div style={{ display: "grid", gridTemplateColumns: isGrid && !mobile ? "repeat(2,1fr)" : "1fr", gap: 12 }}>
              {data.projects.map(proj => (
                <div key={proj.id} style={{ ...card(), overflow: "hidden" }}>
                  {proj.image && <img src={proj.image} alt={proj.name} style={{ width: "100%", height: 120, objectFit: "cover" }} />}
                  <div style={{ padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{proj.name}</span>
                      <ExternalLink style={{ width: 13, height: 13, color: `${preset.text}30` }} />
                    </div>
                    <p style={{ fontSize: 11, color: `${preset.text}50`, lineHeight: 1.6, marginBottom: 10 }}>{proj.desc}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {tags(proj.tags).map(t => <span key={t} style={{ fontSize: 10, padding: "2px 8px", borderRadius: Math.min(r, 6), background: `${accent}20`, color: accent }}>{t}</span>)}
                    </div>
                    {proj.stars > 0 && <div style={{ fontSize: 10, color: `${preset.text}30`, marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}><GitBranch style={{ width: 11, height: 11 }} />{proj.stars} stars</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

        if (id === "skills" && data.skills.length > 0) return (
          <div key="skills" style={{ padding: pad }}>
            {label("Skills")}
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3,1fr)", gap: 12 }}>
              {data.skills.map(group => (
                <div key={group.id} style={{ ...card(), padding: 18 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: accent, textTransform: "uppercase", marginBottom: 12 }}>{group.category}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {group.items.map(item => <span key={item} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: `${preset.text}08`, color: `${preset.text}80`, border: `1px solid ${preset.border}` }}>{item}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

        if (id === "experience" && data.experience.length > 0) return (
          <div key="experience" style={{ padding: pad }}>
            {label("Experience")}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {data.experience.map(exp => (
                <div key={exp.id} style={{ ...card(), padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{exp.role}</span>
                    <span style={{ fontSize: 11, color: `${preset.text}40` }}>{exp.period}</span>
                  </div>
                  <p style={{ fontSize: 12, color: accent, marginBottom: 8 }}>{exp.company}</p>
                  <p style={{ fontSize: 12, color: `${preset.text}55`, lineHeight: 1.6 }}>{exp.desc}</p>
                </div>
              ))}
            </div>
          </div>
        );

        if (id === "testimonials" && data.testimonials.length > 0) return (
          <div key="testimonials" style={{ padding: pad }}>
            {label("What people say")}
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              {data.testimonials.map(t => (
                <div key={t.id} style={{ ...card(), padding: 20 }}>
                  <p style={{ fontSize: 13, color: `${preset.text}70`, lineHeight: 1.7, marginBottom: 16, fontStyle: "italic" }}>"{t.quote}"</p>
                  <p style={{ fontSize: 12, fontWeight: 600 }}>{t.name}</p>
                  <p style={{ fontSize: 11, color: `${preset.text}40` }}>{t.jobTitle}</p>
                </div>
              ))}
            </div>
          </div>
        );

        if (id === "contact") return (
          <div key="contact" style={{ padding: mobile ? "0 20px 48px" : "0 40px 64px", textAlign: "center" }}>
            <div style={{ ...card(), padding: mobile ? "28px 20px" : "40px" }}>
              <h2 style={{ fontSize: mobile ? 20 : 26, fontWeight: 700, marginBottom: 8 }}>Let's work together</h2>
              <p style={{ fontSize: 13, color: `${preset.text}50`, marginBottom: 24, lineHeight: 1.6 }}>Open to new opportunities.</p>
              <a href={`mailto:${data.email}`} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px", borderRadius: Math.min(r, 12), background: accent, color: preset.bg, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                <Mail style={{ width: 14, height: 14 }} /> {data.email}
              </a>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 20 }}>
                {data.github   && <a href={`https://${data.github}`}   style={{ fontSize: 12, color: `${preset.text}50`, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}><GitBranch style={{ width: 12, height: 12 }} />GitHub</a>}
                {data.linkedin && <a href={`https://${data.linkedin}`} style={{ fontSize: 12, color: `${preset.text}50`, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}><Link2 style={{ width: 12, height: 12 }} />LinkedIn</a>}
                {data.twitter  && <a href={`https://twitter.com/${data.twitter.replace("@","")}`} style={{ fontSize: 12, color: `${preset.text}50`, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}><AtSign style={{ width: 12, height: 12 }} />Twitter</a>}
              </div>
            </div>
          </div>
        );

        /* ── Custom blocks ── */
        const block = blockMap[id];
        if (!block) return null;

        if (block.type === "reel") {
          const items = block.items || [];
          const cols = block.columns ?? 1;
          const wrapStyle: React.CSSProperties = cols === 1 && block.width && block.width !== "full"
            ? { width: ({ md: "75%", lg: "90%" } as Record<string,string>)[block.width] ?? "100%", margin: "0 auto" }
            : {};
          return (
            <div key={id} style={{ padding: pad }}>
              {label(block.title)}
              <div style={wrapStyle}>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 12 }}>
                  {items.length > 0 ? items.map(item =>
                    item.url ? (
                      <div key={item.id} style={{ borderRadius: r, overflow: "hidden", background: "#000", position: "relative", paddingBottom: aspectPB(block.aspect) }}>
                        <iframe src={toEmbedUrl(item.url)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }} allow="autoplay; fullscreen" allowFullScreen title={block.title} />
                      </div>
                    ) : (
                      <div key={item.id} style={card({ border: `1px dashed ${preset.border}`, paddingBottom: aspectPB(block.aspect), position: "relative" })}>
                        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                          <Film style={{ width: 32, height: 32, color: `${preset.text}20` }} />
                          <span style={{ fontSize: 12, color: `${preset.text}30` }}>Paste a YouTube or Vimeo URL to preview</span>
                        </div>
                      </div>
                    )
                  ) : (
                    <div style={card({ border: `1px dashed ${preset.border}`, paddingBottom: aspectPB(block.aspect), position: "relative" })}>
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <Film style={{ width: 32, height: 32, color: `${preset.text}20` }} />
                        <span style={{ fontSize: 12, color: `${preset.text}30` }}>Paste a YouTube or Vimeo URL to preview</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        }

        if (block.type === "video") {
          const items = block.items || [];
          const cols = block.columns ?? 1;
          const wrapStyle = cols === 1 ? vidWrapStyle(block.width, block.align) : {};
          return (
            <div key={id} style={{ padding: pad }}>
              {label(block.title)}
              <div style={wrapStyle}>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 12 }}>
                  {items.map(item => (
                    item.url ? (
                      <div key={item.id}>
                        <div style={{ borderRadius: r, overflow: "hidden", background: "#000", position: "relative", paddingBottom: aspectPB(block.aspect) }}>
                          <iframe src={toEmbedUrl(item.url)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }} allow="autoplay; fullscreen" allowFullScreen title={item.caption || block.title} />
                        </div>
                        {item.caption && <p style={{ fontSize: 11, color: `${preset.text}40`, textAlign: "center", marginTop: 8 }}>{item.caption}</p>}
                      </div>
                    ) : (
                      <div key={item.id} style={card({ border: `1px dashed ${preset.border}`, height: 100, display: "flex", alignItems: "center", justifyContent: "center" })}>
                        <span style={{ fontSize: 11, color: `${preset.text}30` }}>Add a YouTube or Vimeo URL</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          );
        }

        if (block.type === "gallery") return (
          <div key={id} style={{ padding: pad }}>
            {label(block.title)}
            {block.images.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: galCols(block), gap: galGap(block.gap) }}>
                {block.images.map((img) => (
                  <div key={img.id} style={{ borderRadius: Math.min(r, 12), overflow: "hidden", aspectRatio: galAspect(block.imageHeight), background: preset.card }}>
                    <img src={img.src} alt={img.caption || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: galCols(block), gap: galGap(block.gap) }}>
                {[...Array(block.columns ?? 4)].map((_, i) => (
                  <div key={i} style={{ ...card(), aspectRatio: galAspect(block.imageHeight), display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ImageIcon style={{ width: 20, height: 20, color: `${preset.text}20` }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );

        if (block.type === "services") return (
          <div key={id} style={{ padding: pad }}>
            {label(block.title)}
            {block.items.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3,1fr)", gap: 12 }}>
                {block.items.map(svc => (
                  <div key={svc.id} style={{ ...card(), padding: 20 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{svc.name}</p>
                    <p style={{ fontSize: 12, color: `${preset.text}50`, lineHeight: 1.6, marginBottom: 12 }}>{svc.desc}</p>
                    {svc.price && <p style={{ fontSize: 14, fontWeight: 700, color: accent }}>{svc.price}</p>}
                  </div>
                ))}
              </div>
            ) : <div style={{ fontSize: 12, color: `${preset.text}30`, padding: "20px 0" }}>Add services in the editor</div>}
          </div>
        );

        if (block.type === "awards") return (
          <div key={id} style={{ padding: pad }}>
            {label(block.title)}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {block.items.map(award => (
                <div key={award.id} style={{ ...card(), padding: "14px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: Math.min(r, 10), background: `${accent}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18 }}>🏆</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{award.title}</p>
                    <p style={{ fontSize: 11, color: `${preset.text}50` }}>{award.org}</p>
                  </div>
                  <span style={{ fontSize: 11, color: `${preset.text}35` }}>{award.year}</span>
                </div>
              ))}
              {block.items.length === 0 && <div style={{ fontSize: 12, color: `${preset.text}30`, padding: "20px 0" }}>Add awards or credits in the editor</div>}
            </div>
          </div>
        );

        if (block.type === "press") return (
          <div key={id} style={{ padding: pad }}>
            {label(block.title)}
            {block.items.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(2,1fr)", gap: 12 }}>
                {block.items.map(item => (
                  <div key={item.id} style={{ ...card(), padding: 20 }}>
                    <p style={{ fontSize: 10, color: accent, fontWeight: 700, letterSpacing: "0.05em", marginBottom: 6, textTransform: "uppercase" }}>{item.publication}{item.year ? ` · ${item.year}` : ""}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5 }}>{item.headline || "Headline"}</p>
                  </div>
                ))}
              </div>
            ) : <div style={{ fontSize: 12, color: `${preset.text}30`, padding: "20px 0" }}>Add press features in the editor</div>}
          </div>
        );

        return null;
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════
   BLOCK EDITORS
══════════════════════════════════════════════ */
function VideoBlockEditor({ block, onChange }: { block: VideoBlock; onChange: (b: VideoBlock) => void }) {
  const btn = (active: boolean) => `flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${active ? "bg-white/[0.07] text-white/80 border border-white/[0.1]" : "bg-white/[0.02] text-white/35 border border-transparent hover:text-white/55"}`;
  const items = block.items || [];
  const updItem = (itemId: string, k: keyof VideoItem, v: string) =>
    onChange({ ...block, items: items.map(i => i.id === itemId ? { ...i, [k]: v } : i) });
  const delItem = (itemId: string) => onChange({ ...block, items: items.filter(i => i.id !== itemId) });
  const addItem = () => onChange({ ...block, items: [...items, { id: uid(), url: "", caption: "" }] });
  const cols = block.columns ?? 1;
  return (
    <div className="space-y-3">
      <Field label="Section Title"><input value={block.title} onChange={e => onChange({ ...block, title: e.target.value })} className={inp} /></Field>
      <div>
        <label className="text-[10px] text-white/35 mb-1.5 block">Layout</label>
        <div className="flex gap-1">
          {([1,2,3] as const).map(n => (
            <button key={n} onClick={() => onChange({ ...block, columns: n })} className={btn(cols===n)}>
              {n===1?"Single":n===2?"Side by side":"3 columns"}
            </button>
          ))}
        </div>
      </div>
      {items.map((item, i) => (
        <div key={item.id} className="rounded-xl bg-white/[0.025] border border-white/[0.06] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/35">Video {i+1}</span>
            {items.length > 1 && <button onClick={() => delItem(item.id)} className="text-red-400/50 hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>}
          </div>
          <input value={item.url} onChange={e => updItem(item.id,"url",e.target.value)} placeholder="https://youtube.com/watch?v=..." className={inpSm} />
          <input value={item.caption} onChange={e => updItem(item.id,"caption",e.target.value)} placeholder="Caption (optional)" className={inpSm} />
          {item.url && <div className="text-[10px] text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> URL detected</div>}
        </div>
      ))}
      <AddBtn onClick={addItem} label="Add video" />
      <div>
        <label className="text-[10px] text-white/35 mb-1.5 block">Aspect Ratio</label>
        <div className="flex gap-1">
          {(["16:9","4:3","1:1"] as const).map(a => (
            <button key={a} onClick={() => onChange({ ...block, aspect: a })} className={btn((block.aspect||"16:9")===a)}>{a}</button>
          ))}
        </div>
      </div>
      {cols === 1 && (
        <>
          <div>
            <label className="text-[10px] text-white/35 mb-1.5 block">Width</label>
            <div className="flex gap-1">
              {(["sm","md","lg","full"] as const).map(w => (
                <button key={w} onClick={() => onChange({ ...block, width: w })} className={btn((block.width||"full")===w)}>
                  {w==="sm"?"Compact":w==="md"?"Medium":w==="lg"?"Wide":"Full"}
                </button>
              ))}
            </div>
          </div>
          {block.width && block.width !== "full" && (
            <div>
              <label className="text-[10px] text-white/35 mb-1.5 block">Alignment</label>
              <div className="flex gap-1">
                {(["left","center","right"] as const).map(a => (
                  <button key={a} onClick={() => onChange({ ...block, align: a })} className={btn((block.align||"center")===a)}>
                    {a.charAt(0).toUpperCase()+a.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ReelBlockEditor({ block, onChange }: { block: ReelBlock; onChange: (b: ReelBlock) => void }) {
  const btn = (active: boolean) => `flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${active ? "bg-white/[0.07] text-white/80 border border-white/[0.1]" : "bg-white/[0.02] text-white/35 border border-transparent hover:text-white/55"}`;
  const items = block.items || [];
  const cols = block.columns ?? 1;
  const updItem = (itemId: string, url: string) =>
    onChange({ ...block, items: items.map(i => i.id === itemId ? { ...i, url } : i) });
  const delItem = (itemId: string) => onChange({ ...block, items: items.filter(i => i.id !== itemId) });
  const addItem = () => onChange({ ...block, items: [...items, { id: uid(), url: "" }] });
  return (
    <div className="space-y-3">
      <Field label="Reel Title"><input value={block.title} onChange={e => onChange({ ...block, title: e.target.value })} className={inp} /></Field>
      <div>
        <label className="text-[10px] text-white/35 mb-1.5 block">Layout</label>
        <div className="flex gap-1">
          {([1,2,3] as const).map(n => (
            <button key={n} onClick={() => onChange({ ...block, columns: n })} className={btn(cols===n)}>
              {n===1?"Single":n===2?"Side by side":"3 columns"}
            </button>
          ))}
        </div>
      </div>
      {items.map((item, i) => (
        <div key={item.id} className="rounded-xl bg-white/[0.025] border border-white/[0.06] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/35">Reel {i+1}</span>
            {items.length > 1 && <button onClick={() => delItem(item.id)} className="text-red-400/50 hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>}
          </div>
          <input value={item.url} onChange={e => updItem(item.id, e.target.value)} placeholder="https://youtube.com/watch?v=..." className={inpSm} />
          {item.url && <div className="text-[10px] text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Ready</div>}
        </div>
      ))}
      <AddBtn onClick={addItem} label="Add reel" />
      <div>
        <label className="text-[10px] text-white/35 mb-1.5 block">Aspect Ratio</label>
        <div className="flex gap-1">
          {(["16:9","4:3","9:16"] as const).map(a => (
            <button key={a} onClick={() => onChange({ ...block, aspect: a })} className={btn((block.aspect||"16:9")===a)}>
              {a==="9:16"?"Portrait":a}
            </button>
          ))}
        </div>
      </div>
      {cols === 1 && (
        <div>
          <label className="text-[10px] text-white/35 mb-1.5 block">Width</label>
          <div className="flex gap-1">
            {(["md","lg","full"] as const).map(w => (
              <button key={w} onClick={() => onChange({ ...block, width: w })} className={btn((block.width||"full")===w)}>
                {w==="md"?"Standard":w==="lg"?"Wide":"Full"}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GalleryBlockEditor({ block, onChange }: { block: GalleryBlock; onChange: (b: GalleryBlock) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => {
      if (f.size > 5 * 1024 * 1024) { toast.error(`${f.name} skipped — max 5 MB`); return false; }
      return true;
    });
    Promise.all(files.map(file => new Promise<GalleryImage>(res => {
      const r = new FileReader();
      r.onload = ev => res({ id: uid(), src: ev.target?.result as string, caption: "" });
      r.readAsDataURL(file);
    }))).then(imgs => onChange({ ...block, images: [...block.images, ...imgs] }));
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      <Field label="Gallery Title"><input value={block.title} onChange={e => onChange({ ...block, title: e.target.value })} className={inp} /></Field>
      <div>
        <label className="text-[10px] text-white/35 mb-1 block">Layout</label>
        <div className="flex gap-1.5">
          {(["grid","masonry","row"] as const).map(l => (
            <button key={l} onClick={() => onChange({ ...block, layout: l })}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${block.layout === l ? "bg-white/[0.07] text-white/80 border border-white/[0.1]" : "bg-white/[0.02] text-white/35 border border-transparent hover:text-white/55"}`}>
              {l === "grid" ? "⊞ Grid" : l === "masonry" ? "⫿ Masonry" : "↔ Row"}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] text-white/35 mb-1 block">Columns</label>
          <div className="flex gap-1">
            {([1,2,3,4] as const).map(n => (
              <button key={n} onClick={() => onChange({ ...block, columns: n })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${(block.columns??3)===n ? "bg-white/[0.07] text-white/80 border border-white/[0.1]" : "bg-white/[0.02] text-white/35 border border-transparent hover:text-white/55"}`}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] text-white/35 mb-1 block">Image Height</label>
          <div className="flex gap-1">
            {(["short","square","tall"] as const).map(h => (
              <button key={h} onClick={() => onChange({ ...block, imageHeight: h })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${(block.imageHeight||"square")===h ? "bg-white/[0.07] text-white/80 border border-white/[0.1]" : "bg-white/[0.02] text-white/35 border border-transparent hover:text-white/55"}`}>
                {h.charAt(0).toUpperCase()+h.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] text-white/35 mb-1 block">Gap</label>
          <div className="flex gap-1">
            {(["sm","md","lg"] as const).map(g => (
              <button key={g} onClick={() => onChange({ ...block, gap: g })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${(block.gap||"md")===g ? "bg-white/[0.07] text-white/80 border border-white/[0.1]" : "bg-white/[0.02] text-white/35 border border-transparent hover:text-white/55"}`}>
                {g==="sm"?"Tight":g==="md"?"Normal":"Loose"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      {block.images.length > 0 ? (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1.5">
            {block.images.map(img => (
              <div key={img.id} className="relative rounded-lg overflow-hidden aspect-square bg-white/[0.02] group">
                <img src={img.src} alt="" className="w-full h-full object-cover" />
                <button onClick={() => onChange({ ...block, images: block.images.filter(i => i.id !== img.id) })}
                  className="absolute top-1 right-1 w-5 h-5 rounded bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
          <button onClick={() => fileRef.current?.click()} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-white/[0.1] text-xs text-white/35 hover:text-white/55 hover:border-white/[0.2] transition-all">
            <Plus className="w-3 h-3" /> Add more
          </button>
        </div>
      ) : (
        <button onClick={() => fileRef.current?.click()} className="w-full py-8 rounded-xl border-2 border-dashed border-white/[0.08] flex flex-col items-center justify-center gap-2 text-white/35 hover:text-white/55 hover:border-white/[0.15] transition-all">
          <ImageIcon className="w-6 h-6" />
          <span className="text-xs">Upload photos</span>
          <span className="text-[10px] text-white/25">Select multiple files</span>
        </button>
      )}
    </div>
  );
}

function ServicesBlockEditor({ block, onChange }: { block: ServicesBlock; onChange: (b: ServicesBlock) => void }) {
  const add = () => onChange({ ...block, items: [...block.items, { id: uid(), name: "New Service", desc: "", price: "" }] });
  const upd = (id: string, k: keyof ServiceItem, v: string) =>
    onChange({ ...block, items: block.items.map(s => s.id === id ? { ...s, [k]: v } : s) });
  const del = (id: string) => onChange({ ...block, items: block.items.filter(s => s.id !== id) });
  return (
    <div className="space-y-3">
      <Field label="Section Title"><input value={block.title} onChange={e => onChange({ ...block, title: e.target.value })} className={inp} /></Field>
      {block.items.map((svc, i) => (
        <div key={svc.id} className="rounded-xl bg-white/[0.025] border border-white/[0.06] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/35">Service {i+1}</span>
            <button onClick={() => del(svc.id)} className="text-red-400/50 hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
          </div>
          <input value={svc.name} onChange={e => upd(svc.id,"name",e.target.value)} placeholder="Service name" className={inpSm} />
          <textarea value={svc.desc} onChange={e => upd(svc.id,"desc",e.target.value)} placeholder="Short description…" rows={2} className={`${inpSm} resize-none`} />
          <input value={svc.price} onChange={e => upd(svc.id,"price",e.target.value)} placeholder="Price e.g. $250" className={inpSm} />
        </div>
      ))}
      <AddBtn onClick={add} label="Add service" />
    </div>
  );
}

function AwardsBlockEditor({ block, onChange }: { block: AwardsBlock; onChange: (b: AwardsBlock) => void }) {
  const add = () => onChange({ ...block, items: [...block.items, { id: uid(), title: "Award Title", org: "Organization", year: "2024" }] });
  const upd = (id: string, k: keyof AwardItem, v: string) =>
    onChange({ ...block, items: block.items.map(a => a.id === id ? { ...a, [k]: v } : a) });
  const del = (id: string) => onChange({ ...block, items: block.items.filter(a => a.id !== id) });
  return (
    <div className="space-y-3">
      <Field label="Section Title"><input value={block.title} onChange={e => onChange({ ...block, title: e.target.value })} className={inp} /></Field>
      {block.items.map((award, i) => (
        <div key={award.id} className="rounded-xl bg-white/[0.025] border border-white/[0.06] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/35">Entry {i+1}</span>
            <button onClick={() => del(award.id)} className="text-red-400/50 hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
          </div>
          <input value={award.title} onChange={e => upd(award.id,"title",e.target.value)} placeholder="Award or credit" className={inpSm} />
          <div className="grid grid-cols-2 gap-2">
            <input value={award.org}  onChange={e => upd(award.id,"org",e.target.value)}  placeholder="Organization" className={inpSm} />
            <input value={award.year} onChange={e => upd(award.id,"year",e.target.value)} placeholder="Year"         className={inpSm} />
          </div>
        </div>
      ))}
      <AddBtn onClick={add} label="Add entry" />
    </div>
  );
}

function PressBlockEditor({ block, onChange }: { block: PressBlock; onChange: (b: PressBlock) => void }) {
  const add = () => onChange({ ...block, items: [...block.items, { id: uid(), publication: "", headline: "", url: "", year: "" }] });
  const upd = (id: string, k: keyof PressItem, v: string) =>
    onChange({ ...block, items: block.items.map(p => p.id === id ? { ...p, [k]: v } : p) });
  const del = (id: string) => onChange({ ...block, items: block.items.filter(p => p.id !== id) });
  return (
    <div className="space-y-3">
      <Field label="Section Title"><input value={block.title} onChange={e => onChange({ ...block, title: e.target.value })} className={inp} /></Field>
      {block.items.map((item, i) => (
        <div key={item.id} className="rounded-xl bg-white/[0.025] border border-white/[0.06] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/35">Feature {i+1}</span>
            <button onClick={() => del(item.id)} className="text-red-400/50 hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={item.publication} onChange={e => upd(item.id,"publication",e.target.value)} placeholder="Publication" className={inpSm} />
            <input value={item.year}        onChange={e => upd(item.id,"year",e.target.value)}        placeholder="Year"        className={inpSm} />
          </div>
          <input value={item.headline} onChange={e => upd(item.id,"headline",e.target.value)} placeholder="Article headline…" className={inpSm} />
          <input value={item.url}      onChange={e => upd(item.id,"url",e.target.value)}      placeholder="https://…"         className={`${inpSm} text-white/40`} />
        </div>
      ))}
      <AddBtn onClick={add} label="Add press feature" />
    </div>
  );
}

/* ── Existing editors ── */
function HeroEditor({ data, onChange }: { data: PortfolioData; onChange: (d: Partial<PortfolioData>) => void }) {
  const photoRef = useRef<HTMLInputElement>(null);
  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 3*1024*1024) { toast.error("Image must be under 3 MB"); return; }
    const r = new FileReader();
    r.onload = ev => onChange({ photo: ev.target?.result as string });
    r.readAsDataURL(file); e.target.value = "";
  };
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] text-white/35 mb-2 block">Profile Photo</label>
        <div className="flex items-center gap-3">
          <div onClick={() => photoRef.current?.click()} className="relative w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center cursor-pointer hover:bg-white/[0.06] transition-colors overflow-hidden flex-shrink-0 group">
            {data.photo ? <img src={data.photo} alt="Profile" className="w-full h-full object-cover" /> : <Camera className="w-5 h-5 text-white/25 group-hover:text-white/45 transition-colors" />}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Camera className="w-4 h-4 text-white" /></div>
          </div>
          <div className="flex-1 min-w-0">
            <button onClick={() => photoRef.current?.click()} className="w-full px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs text-white/45 hover:bg-white/[0.06] transition-all text-left">
              {data.photo ? "Change photo" : "Upload photo"}
            </button>
            {data.photo && <button onClick={() => onChange({ photo: undefined })} className="mt-1 text-[10px] text-red-400/50 hover:text-red-400 transition-colors">Remove</button>}
          </div>
        </div>
        <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
      </div>
      {data.photo && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-white/35 mb-1.5 block">Photo Size</label>
            <div className="flex gap-1">
              {(["sm","md","lg","xl"] as const).map(s => (
                <button key={s} onClick={() => onChange({ photoSize: s })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${(data.photoSize||"md")===s ? "bg-white/[0.07] text-white/80 border border-white/[0.1]" : "bg-white/[0.02] text-white/35 border border-transparent hover:text-white/55"}`}>
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-white/35 mb-1.5 block">Photo Shape</label>
            <div className="flex gap-1">
              {(["circle","rounded","square"] as const).map(s => (
                <button key={s} onClick={() => onChange({ photoShape: s })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${(data.photoShape||"rounded")===s ? "bg-white/[0.07] text-white/80 border border-white/[0.1]" : "bg-white/[0.02] text-white/35 border border-transparent hover:text-white/55"}`}>
                  {s.charAt(0).toUpperCase()+s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {([{ label:"Full Name", key:"name" as const },{ label:"Initials", key:"initials" as const },{ label:"Job Title", key:"title" as const }]).map(f => (
          <div key={f.key} className={f.key === "title" ? "col-span-2" : ""}>
            <label className="text-[10px] text-white/35 mb-1 block">{f.label}</label>
            <input value={data[f.key]} onChange={e => onChange({ [f.key]: e.target.value })} className={inp} />
          </div>
        ))}
      </div>
      <div>
        <label className="text-[10px] text-white/35 mb-1 block">Bio / About</label>
        <textarea value={data.bio} onChange={e => onChange({ bio: e.target.value })} rows={4} className={`${inp} resize-none leading-relaxed`} />
      </div>
    </div>
  );
}

function ProjectsEditor({ data, onChange }: { data: PortfolioData; onChange: (d: Partial<PortfolioData>) => void }) {
  const imageRef = useRef<HTMLInputElement>(null);
  const [uploadFor, setUploadFor] = useState<string|null>(null);
  const set = (id: string, k: keyof Project, v: string|number) =>
    onChange({ projects: data.projects.map(p => p.id === id ? { ...p, [k]: v } : p) });
  const handleImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !uploadFor) return;
    if (file.size > 3*1024*1024) { toast.error("Image must be under 3 MB"); return; }
    const r = new FileReader();
    r.onload = ev => set(uploadFor, "image", ev.target?.result as string);
    r.readAsDataURL(file); e.target.value = ""; setUploadFor(null);
  };
  return (
    <div className="space-y-3">
      <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImg} />
      {data.projects.map((proj, i) => (
        <div key={proj.id} className="rounded-xl bg-white/[0.025] border border-white/[0.06] overflow-hidden">
          {proj.image ? (
            <div className="relative">
              <img src={proj.image} alt={proj.name} className="w-full h-28 object-cover" />
              <button onClick={() => set(proj.id,"image","")} className="absolute top-2 right-2 w-6 h-6 rounded-md bg-black/60 flex items-center justify-center text-white/70 hover:text-white"><X className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <button onClick={() => { setUploadFor(proj.id); setTimeout(() => imageRef.current?.click(), 30); }} className="w-full py-3 border-b border-white/[0.06] flex items-center justify-center gap-2 text-[10px] text-white/35 hover:text-white/55 hover:bg-white/[0.02] transition-all">
              <ImagePlus className="w-3.5 h-3.5" /> Add screenshot
            </button>
          )}
          <div className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/45">Project {i+1}</span>
              <button onClick={() => onChange({ projects: data.projects.filter(p => p.id !== proj.id) })} className="text-red-400/50 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
            <input value={proj.name} onChange={e => set(proj.id,"name",e.target.value)} placeholder="Project name" className={inp} />
            <textarea value={proj.desc} onChange={e => set(proj.id,"desc",e.target.value)} placeholder="Short description…" rows={2} className={`${inp} resize-none`} />
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[10px] text-white/35 mb-1 block">Tags</label><input value={proj.tags} onChange={e => set(proj.id,"tags",e.target.value)} placeholder="React, Node.js" className={inpSm} /></div>
              <div><label className="text-[10px] text-white/35 mb-1 block">Stars</label><input type="number" value={proj.stars} onChange={e => set(proj.id,"stars",Number(e.target.value))} min={0} className={inpSm} /></div>
            </div>
            <input value={proj.link} onChange={e => set(proj.id,"link",e.target.value)} placeholder="github.com/you/project" className={`${inpSm} text-white/40`} />
          </div>
        </div>
      ))}
      <AddBtn onClick={() => onChange({ projects: [...data.projects, { id: uid(), name: "New Project", desc: "", tags: "", link: "", stars: 0 }] })} label="Add project" />
    </div>
  );
}

function SkillsEditor({ data, onChange }: { data: PortfolioData; onChange: (d: Partial<PortfolioData>) => void }) {
  const [newItem, setNewItem] = useState<Record<string,string>>({});
  const setGrp = (id: string, k: keyof SkillGroup, v: string|string[]) =>
    onChange({ skills: data.skills.map(g => g.id === id ? { ...g, [k]: v } : g) });
  return (
    <div className="space-y-3">
      {data.skills.map(group => (
        <div key={group.id} className="rounded-xl bg-white/[0.025] border border-white/[0.06] p-4">
          <div className="flex items-center gap-2 mb-3">
            <input value={group.category} onChange={e => setGrp(group.id,"category",e.target.value)} className="flex-1 bg-transparent border-none text-xs font-semibold text-white/45 uppercase tracking-wider focus:outline-none focus:text-white/90" />
            <button onClick={() => onChange({ skills: data.skills.filter(g => g.id !== group.id) })} className="text-red-400/40 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {group.items.map(item => (
              <span key={item} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.06] text-xs text-white/60">
                {item}
                <button onClick={() => setGrp(group.id,"items",group.items.filter(i => i !== item))} className="text-white/25 hover:text-red-400 transition-colors ml-0.5"><X className="w-2.5 h-2.5" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-1.5">
            <input value={newItem[group.id]||""} onChange={e => setNewItem(p => ({ ...p, [group.id]: e.target.value }))}
              onKeyDown={e => { if (e.key==="Enter") { const v=(newItem[group.id]||"").trim(); if(v){setGrp(group.id,"items",[...group.items,v]);setNewItem(p=>({...p,[group.id]:""}));}}}}
              placeholder="Add skill…" className={`${inpSm} flex-1`} />
            <button onClick={() => { const v=(newItem[group.id]||"").trim(); if(v){setGrp(group.id,"items",[...group.items,v]);setNewItem(p=>({...p,[group.id]:""}))}}} className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] text-white/55 text-xs border border-white/[0.1] hover:bg-white/[0.09] transition-all">Add</button>
          </div>
        </div>
      ))}
      <AddBtn onClick={() => onChange({ skills: [...data.skills, { id: uid(), category: "New Category", items: [] }] })} label="Add skill group" />
    </div>
  );
}

function ExperienceEditor({ data, onChange }: { data: PortfolioData; onChange: (d: Partial<PortfolioData>) => void }) {
  const set = (id: string, k: keyof ExpEntry, v: string) =>
    onChange({ experience: data.experience.map(e => e.id === id ? { ...e, [k]: v } : e) });
  return (
    <div className="space-y-3">
      {data.experience.map((exp, i) => (
        <div key={exp.id} className="rounded-xl bg-white/[0.025] border border-white/[0.06] p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/45">Position {i+1}</span>
            <button onClick={() => onChange({ experience: data.experience.filter(e => e.id !== exp.id) })} className="text-red-400/50 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {([{ label:"Role", key:"role" as const },{ label:"Company", key:"company" as const },{ label:"Period", key:"period" as const }]).map(f => (
              <div key={f.key} className={f.key==="period"?"col-span-2":""}>
                <label className="text-[10px] text-white/35 mb-1 block">{f.label}</label>
                <input value={exp[f.key]} onChange={e => set(exp.id, f.key, e.target.value)} className={inpSm} />
              </div>
            ))}
          </div>
          <textarea value={exp.desc} onChange={e => set(exp.id,"desc",e.target.value)} rows={2} placeholder="Brief description…" className={`${inpSm} resize-none`} />
        </div>
      ))}
      <AddBtn onClick={() => onChange({ experience: [...data.experience, { id: uid(), role: "Job Title", company: "Company", period: "Start – End", desc: "" }] })} label="Add position" />
    </div>
  );
}

function TestimonialsEditor({ data, onChange }: { data: PortfolioData; onChange: (d: Partial<PortfolioData>) => void }) {
  const set = (id: string, k: keyof Testimonial, v: string) =>
    onChange({ testimonials: data.testimonials.map(t => t.id === id ? { ...t, [k]: v } : t) });
  return (
    <div className="space-y-3">
      {data.testimonials.map((t, i) => (
        <div key={t.id} className="rounded-xl bg-white/[0.025] border border-white/[0.06] p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/45">Testimonial {i+1}</span>
            <button onClick={() => onChange({ testimonials: data.testimonials.filter(x => x.id !== t.id) })} className="text-red-400/50 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <textarea value={t.quote} onChange={e => set(t.id,"quote",e.target.value)} rows={3} placeholder="Quote…" className={`${inp} resize-none leading-relaxed`} />
          <div className="grid grid-cols-2 gap-2">
            <input value={t.name}     onChange={e => set(t.id,"name",e.target.value)}     placeholder="Name"           className={inpSm} />
            <input value={t.jobTitle} onChange={e => set(t.id,"jobTitle",e.target.value)} placeholder="Title @ Company" className={inpSm} />
          </div>
        </div>
      ))}
      <AddBtn onClick={() => onChange({ testimonials: [...data.testimonials, { id: uid(), quote: "", name: "", jobTitle: "" }] })} label="Add testimonial" />
    </div>
  );
}

function ContactEditor({ data, onChange }: { data: PortfolioData; onChange: (d: Partial<PortfolioData>) => void }) {
  return (
    <div className="space-y-3">
      {([
        { label:"Email",    key:"email"    as const, placeholder:"you@example.com",          icon: Mail },
        { label:"GitHub",   key:"github"   as const, placeholder:"github.com/username",       icon: GitBranch },
        { label:"LinkedIn", key:"linkedin" as const, placeholder:"linkedin.com/in/username",  icon: Link2 },
        { label:"Twitter",  key:"twitter"  as const, placeholder:"@username",                 icon: AtSign },
      ]).map(f => (
        <div key={f.key}>
          <label className="text-[10px] text-white/35 mb-1.5 flex items-center gap-1.5 block"><f.icon className="w-3 h-3" /> {f.label}</label>
          <input value={data[f.key]} onChange={e => onChange({ [f.key]: e.target.value })} placeholder={f.placeholder} className={inp} />
        </div>
      ))}
    </div>
  );
}

/* ── Shared UI atoms ── */
const inp   = "w-full px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] text-sm text-white/80 focus:outline-none focus:border-white/[0.15] transition-colors";
const inpSm = "w-full px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs text-white/60 focus:outline-none focus:border-white/[0.15] transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-[10px] text-white/35 mb-1 block">{label}</label>{children}</div>;
}
function AddBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/[0.1] text-xs text-white/35 hover:text-white/55 hover:border-white/[0.2] transition-all">
      <Plus className="w-3.5 h-3.5" /> {label}
    </button>
  );
}

/* ── Modals ── */
function AddBlockModal({ onAdd, onClose }: { onAdd: (t: CustomBlock["type"]) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
        className="bg-[#0e0e1a] border border-white/[0.1] rounded-2xl p-5 w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-white/80">Add Block</span>
          <button onClick={onClose} className="text-white/35 hover:text-white/55"><X className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {BLOCK_CATALOG.map(b => (
            <button key={b.type} onClick={() => { onAdd(b.type); onClose(); }}
              className="flex flex-col items-start gap-1.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07] hover:border-white/[0.12] transition-all text-left group">
              <span className="text-xl">{b.icon}</span>
              <span className="text-xs font-medium text-white/70 group-hover:text-white/90">{b.label}</span>
              <span className="text-[10px] text-white/30">{b.desc}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function TypePickerModal({ current, onSelect, onClose }: { current: string; onSelect: (t: string) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
        className="bg-[#0e0e1a] border border-white/[0.1] rounded-2xl p-5 w-96 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-white/80">Portfolio Type</span>
          <button onClick={onClose} className="text-white/35 hover:text-white/55"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-[11px] text-white/35 mb-4">Pre-loads relevant blocks. All your content is preserved.</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(PORTFOLIO_TYPES).map(([key, def]) => (
            <button key={key} onClick={() => { onSelect(key); onClose(); }}
              className={`flex flex-col items-start gap-1 p-3 rounded-xl border transition-all text-left group ${current === key ? "bg-white/[0.07] border-white/[0.15]" : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.07]"}`}>
              <span className="text-xl">{def.icon}</span>
              <span className="text-xs font-medium text-white/70 group-hover:text-white/90">{def.label}</span>
              <span className="text-[10px] text-white/30">{def.desc}</span>
              {current === key && <Check className="w-3 h-3 text-white/60 mt-0.5" />}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */
export default function PortfolioEditorPage() {
  const [data, setData] = useState<PortfolioData>(DEFAULT);
  const [activeTheme, setActiveTheme] = useState("minimal");
  const [viewMode, setViewMode] = useState<"desktop"|"mobile">("desktop");
  const [subdomain, setSubdomain] = useState("johndev");
  const [published, setPublished] = useState(false);
  const [leftTab, setLeftTab] = useState<"design"|"content">("design");
  const [editSection, setEditSection] = useState("hero");
  const [aiLoading, setAiLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const router = useRouter();

  const currentPreset = getPreset(activeTheme);

  const [loaded, setLoaded] = useState(false);

  const migrateBlocks = (blocks: CustomBlock[]): CustomBlock[] => blocks.map(b => {
    if (b.type === "video" && !("items" in b)) {
      const old = b as unknown as { id: string; type: "video"; title: string; url: string; caption: string };
      return { id: old.id, type: "video", title: old.title, items: [{ id: uid(), url: old.url || "", caption: old.caption || "" }], columns: 1 } as VideoBlock;
    }
    if (b.type === "reel" && !("items" in b)) {
      const old = b as unknown as { id: string; type: "reel"; title: string; url: string };
      return { id: old.id, type: "reel", title: old.title, items: [{ id: uid(), url: old.url || "" }], columns: 1 } as ReelBlock;
    }
    return b;
  });

  const applyStored = (p: { data?: PortfolioData; theme?: string; subdomain?: string; published?: boolean }) => {
    if (p.data) setData({ ...DEFAULT, ...p.data, customBlocks: migrateBlocks(p.data.customBlocks || []), sectionOrder: p.data.sectionOrder || DEFAULT.sectionOrder });
    if (p.theme) setActiveTheme(p.theme);
    if (p.subdomain) setSubdomain(p.subdomain);
    if (p.published) setPublished(p.published);
  };

  /* Load from API on mount, fall back to localStorage */
  useEffect(() => {
    fetch("/api/user/portfolio")
      .then(r => r.json())
      .then(json => {
        if (json.data) { applyStored(json); }
        else { localStorage.removeItem("folio_portfolio"); }
      })
      .catch(() => {
        const stored = localStorage.getItem("folio_portfolio");
        if (stored) { try { applyStored(JSON.parse(stored)); } catch {} }
      })
      .finally(() => setLoaded(true));
    fetch("/api/user/subscription")
      .then(r => r.json())
      .then(json => setIsPro(json.isPro === true))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveToApi = (d = data, theme = activeTheme, sub = subdomain, pub = published) => {
    localStorage.setItem("folio_portfolio", JSON.stringify({ data: d, theme, subdomain: sub, published: pub }));
    return fetch("/api/user/portfolio", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: d, theme, subdomain: sub, published: pub }),
    }).catch(() => {});
  };

  /* Auto-save after initial load */
  useEffect(() => {
    if (!loaded) return;
    const id = setTimeout(() => saveToApi(), 600);
    return () => clearTimeout(id);
  }, [data, activeTheme, subdomain, published, loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (partial: Partial<PortfolioData>) => setData(p => ({ ...p, ...partial }));

  const updateBlock = (blockId: string, updated: CustomBlock) =>
    update({ customBlocks: data.customBlocks.map(b => b.id === blockId ? updated : b) });

  const addBlock = (type: CustomBlock["type"]) => {
    const block = makeBlock(type);
    update({ customBlocks: [...data.customBlocks, block], sectionOrder: [...data.sectionOrder, block.id] });
    setEditSection(block.id); setLeftTab("content");
  };

  const deleteBlock = (id: string) => {
    update({ customBlocks: data.customBlocks.filter(b => b.id !== id), sectionOrder: data.sectionOrder.filter(s => s !== id) });
    if (editSection === id) setEditSection("hero");
  };

  const toggleSection = (id: string) => {
    const active = data.sectionOrder.includes(id);
    update({ sectionOrder: active ? data.sectionOrder.filter(s => s !== id) : [...data.sectionOrder, id] });
    if (active && editSection === id) setEditSection("hero");
  };

  const moveSection = (id: string, dir: -1|1) => {
    const order = [...data.sectionOrder];
    const i = order.indexOf(id); const j = i + dir;
    if (i === -1 || j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    update({ sectionOrder: order });
  };

  const applyType = (type: string) => {
    const def = PORTFOLIO_TYPES[type]; if (!def) return;
    const idMap: Record<string,string> = {};
    const newBlocks: CustomBlock[] = def.defaultBlocks.map(b => {
      const newId = uid(); idMap[b.id] = newId;
      return { ...b, id: newId } as CustomBlock;
    });
    const newOrder = def.defaultOrder.map(id => idMap[id] || id);
    update({ portfolioType: type, customBlocks: newBlocks, sectionOrder: newOrder });
    setEditSection("hero");
  };

  const getSectionMeta = (id: string) => {
    if (SECTION_META[id]) return { ...SECTION_META[id], isBuiltIn: true };
    const block = data.customBlocks.find(b => b.id === id);
    if (block) {
      const cat = BLOCK_CATALOG.find(c => c.type === block.type);
      return { label: block.title || cat?.label || "Block", icon: cat?.icon || "📦", isBuiltIn: false };
    }
    return { label: id, icon: "📦", isBuiltIn: false };
  };

  const handleSave = () => {
    saveToApi(); setSaved(true); toast.success("Portfolio saved!"); setTimeout(() => setSaved(false), 2000);
  };
  const handlePublish = () => {
    setPublished(true);
    saveToApi(data, activeTheme, subdomain, true);
    toast.success("Portfolio published!", { description: `Live at ${window.location.origin}/p/${subdomain}` });
  };
  const handleUnpublish = () => {
    setPublished(false);
    saveToApi(data, activeTheme, subdomain, false);
    toast.success("Portfolio unpublished — it's now private");
  };
  const handlePreview = async () => {
    if (!published) {
      setPublished(true);
      await saveToApi(data, activeTheme, subdomain, true);
    } else {
      await saveToApi();
    }
    window.open(`/p/${subdomain}`, "_blank");
  };
  const handleShare = async () => {
    try { await navigator.clipboard.writeText(`${window.location.origin}/p/${subdomain}`); toast.success("Link copied!"); }
    catch { toast.error("Could not copy link"); }
  };

  const handleAiAction = async (label: string) => {
    setAiLoading(true);
    const id = toast.loading(`${label}…`);
    try {
      const res = await fetch("/api/ai/portfolio", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: label, data: { name: data.name, title: data.title, skills: data.skills.flatMap(g => g.items).join(", "), experience: data.experience.map(e => `${e.role} at ${e.company}`).join(", "), project: data.projects[0] } }),
      });
      const json = await res.json(); if (json.error) throw new Error(json.error);
      toast.dismiss(id);
      if (label === "Generate bio") { update({ bio: json.text }); setEditSection("hero"); setLeftTab("content"); toast.success("Bio updated!"); }
      else if (label === "Add testimonials") {
        const lines = json.text.split("\n\n").filter((l: string) => l.trim());
        const newT = lines.map((line: string) => { const m = line.match(/"([^"]+)"\s*—\s*(.+),\s*(.+)/); return m ? { id: uid(), quote: m[1], name: m[2].trim(), jobTitle: m[3].trim() } : { id: uid(), quote: line.replace(/^["']|["']$/g,"").trim(), name: "Colleague", jobTitle: "Peer" }; });
        update({ testimonials: [...data.testimonials, ...newT], sectionOrder: data.sectionOrder.includes("testimonials") ? data.sectionOrder : [...data.sectionOrder, "testimonials"] });
        toast.success(`${newT.length} testimonials added!`);
      } else if (label === "Write case studies" && data.projects[0]) {
        update({ projects: data.projects.map((p,i) => i===0 ? { ...p, desc: json.text } : p) });
        toast.success("Case study applied!");
      } else toast.success("Done!", { description: json.text?.slice(0,80) });
    } catch { toast.dismiss(id); toast.error("AI request failed"); }
    finally { setAiLoading(false); }
  };

  const renderEditor = () => {
    if (BUILT_IN.includes(editSection)) {
      if (editSection === "hero")         return <HeroEditor data={data} onChange={update} />;
      if (editSection === "projects")     return <ProjectsEditor data={data} onChange={update} />;
      if (editSection === "skills")       return <SkillsEditor data={data} onChange={update} />;
      if (editSection === "experience")   return <ExperienceEditor data={data} onChange={update} />;
      if (editSection === "testimonials") return <TestimonialsEditor data={data} onChange={update} />;
      if (editSection === "contact")      return <ContactEditor data={data} onChange={update} />;
    }
    const block = data.customBlocks.find(b => b.id === editSection);
    if (!block) return <div className="text-xs text-white/35">Select a section to edit</div>;
    if (block.type === "video")    return <VideoBlockEditor    block={block as VideoBlock}    onChange={b => updateBlock(block.id, b)} />;
    if (block.type === "reel")     return <ReelBlockEditor     block={block as ReelBlock}     onChange={b => updateBlock(block.id, b)} />;
    if (block.type === "gallery")  return <GalleryBlockEditor  block={block as GalleryBlock}  onChange={b => updateBlock(block.id, b)} />;
    if (block.type === "services") return <ServicesBlockEditor block={block as ServicesBlock} onChange={b => updateBlock(block.id, b)} />;
    if (block.type === "awards")   return <AwardsBlockEditor   block={block as AwardsBlock}   onChange={b => updateBlock(block.id, b)} />;
    if (block.type === "press")    return <PressBlockEditor    block={block as PressBlock}    onChange={b => updateBlock(block.id, b)} />;
    return null;
  };

  const preview = (
    <div className={`flex-1 overflow-hidden flex flex-col bg-white/[0.03]`}>
      <div className="px-4 py-2 border-b border-white/[0.05] bg-white/[0.03] flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/60" /><div className="w-3 h-3 rounded-full bg-amber-500/60" /><div className="w-3 h-3 rounded-full bg-emerald-500/60" />
        </div>
        <span className="text-[10px] text-white/35 mx-auto font-mono">folio.ai/{subdomain}</span>
      </div>
      <div className={`flex-1 overflow-y-auto ${viewMode === "mobile" ? "p-4" : ""}`}>
        <div className={`mx-auto transition-all duration-300 ${viewMode === "mobile" ? "max-w-[390px]" : "max-w-full"}`}>
          <div className={viewMode === "mobile" ? "rounded-2xl overflow-hidden shadow-2xl border border-white/[0.06]" : ""}>
            <PortfolioPreview data={data} preset={currentPreset} mobile={viewMode === "mobile"} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />
      {showAddBlock  && <AddBlockModal   onAdd={addBlock}  onClose={() => setShowAddBlock(false)} />}
      {showTypePicker && <TypePickerModal current={data.portfolioType} onSelect={applyType} onClose={() => setShowTypePicker(false)} />}

      <div className="flex-1 md:ml-[220px] flex flex-col h-screen">
        {/* Toolbar */}
        <div className="h-14 border-b border-white/[0.05] flex items-center gap-2 px-4 pl-14 md:pl-4 bg-white/[0.03] flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-white/35 hover:text-white/55 transition-colors mr-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <div className="w-px h-4 bg-white/[0.1]" />
          <Globe className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-white/90">Portfolio Editor</span>
          {published && <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">● Live</span>}
          <div className="ml-auto flex items-center gap-1.5">
            <div className="hidden sm:flex items-center gap-0.5 bg-white/[0.02] rounded-lg p-0.5">
              {([["desktop", Monitor], ["mobile", Smartphone]] as const).map(([mode, Icon]) => (
                <button key={mode} onClick={() => setViewMode(mode)} className={`px-2 py-1.5 rounded-md transition-all ${viewMode === mode ? "bg-white/[0.08] text-white/90" : "text-white/35 hover:text-white/55"}`}>
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
            <button onClick={handlePreview} title="View your live portfolio" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/[0.02] border border-white/[0.06] text-white/45 hover:bg-white/[0.06] transition-all"><Eye className="w-3.5 h-3.5" /> View Live</button>
            <button onClick={handleShare}   className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/[0.02] border border-white/[0.06] text-white/45 hover:bg-white/[0.06] transition-all"><Share2 className="w-3.5 h-3.5" /> Share</button>
            <button onClick={handleSave}    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${saved ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-white/[0.02] border-white/[0.06] text-white/45 hover:bg-white/[0.06]"}`}>
              {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}{saved ? "Saved" : "Save"}
            </button>
            {published ? (
              <button onClick={handleUnpublish} className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] border border-white/[0.1] text-white/55 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all">
                <Globe className="w-3.5 h-3.5" /> Unpublish
              </button>
            ) : (
              <button onClick={handlePublish} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:opacity-90 transition-opacity">
                <Zap className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Publish</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT PANEL */}
          <div className="w-full md:w-60 border-r border-white/[0.05] bg-white/[0.03] md:flex-shrink-0 flex flex-col overflow-y-auto md:overflow-visible">
            <div className="flex border-b border-white/[0.05] flex-shrink-0">
              {([["design","Design",Palette],["content","Content",Edit3]] as const).map(([id,label,Icon]) => (
                <button key={id} onClick={() => setLeftTab(id)} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all ${leftTab===id ? "text-white border-b-2 border-white/40" : "text-white/35 hover:text-white/55"}`}>
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {leftTab === "design" ? (
                <div className="space-y-5">
                  {/* Portfolio type */}
                  <div>
                    <div className="text-[10px] text-white/35 uppercase tracking-wider font-medium mb-2 px-1">Portfolio Type</div>
                    <button onClick={() => setShowTypePicker(true)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] transition-all text-left">
                      <span className="text-lg">{PORTFOLIO_TYPES[data.portfolioType]?.icon || "💼"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white/70">{PORTFOLIO_TYPES[data.portfolioType]?.label || "Custom"}</div>
                        <div className="text-[10px] text-white/30">Tap to change type</div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-white/25" />
                    </button>
                  </div>

                  {/* Design Presets */}
                  <div>
                    <div className="text-[10px] text-white/35 uppercase tracking-wider font-medium mb-3 px-1">Design Preset</div>
                    <div className="grid grid-cols-2 gap-2">
                      {PRESETS.map(p => {
                        const locked = p.pro && !isPro;
                        return (
                          <button key={p.id}
                            onClick={() => locked ? router.push("/settings?tab=billing") : setActiveTheme(p.id)}
                            className={`relative rounded-xl overflow-hidden text-left transition-all group ${activeTheme === p.id ? "ring-2 ring-white/40" : locked ? "opacity-60 hover:opacity-80" : "hover:ring-1 hover:ring-white/20"}`}
                            style={{ background: p.bgGradient ? `${p.bgGradient}, ${p.bg}` : p.bg, padding: "10px 10px 8px" }}
                          >
                            {/* Mini card mockup */}
                            <div style={{
                              background: p.cardStyle === "glass" ? "rgba(255,255,255,0.07)" : p.cardStyle === "outlined" ? "transparent" : p.card,
                              border: `1px solid ${p.border}`,
                              borderRadius: Math.min(p.radius, 8),
                              padding: "6px 8px",
                              marginBottom: 7,
                            }}>
                              <div style={{ height: 4, width: "65%", background: p.text, opacity: 0.55, borderRadius: 2, marginBottom: 4 }} />
                              <div style={{ height: 3, width: "40%", background: p.accent, opacity: 0.8, borderRadius: 2 }} />
                            </div>
                            {/* Label row */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <span style={{ fontSize: 10, fontWeight: 600, color: p.text, opacity: 0.8, fontFamily: p.font === "mono" ? "monospace" : p.font === "serif" ? "Georgia,serif" : "inherit" }}>{p.label}</span>
                              {activeTheme === p.id
                                ? <div style={{ width: 6, height: 6, borderRadius: "50%", background: p.accent }} />
                                : locked && <Crown style={{ width: 9, height: 9, color: "#fbbf24", opacity: 0.8 }} />
                              }
                            </div>
                            {/* Lock overlay on hover for pro themes */}
                            {locked && (
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" style={{ background: "rgba(0,0,0,0.55)" }}>
                                <div className="flex flex-col items-center gap-1">
                                  <Crown style={{ width: 14, height: 14, color: "#fbbf24" }} />
                                  <span style={{ fontSize: 9, fontWeight: 700, color: "#fbbf24" }}>Pro Only</span>
                                </div>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Accent color */}
                  <div>
                    <div className="text-[10px] text-white/35 uppercase tracking-wider font-medium mb-2 px-1">Accent Color</div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                      <input type="color" value={data.accentColor || currentPreset.accent} onChange={e => update({ accentColor: e.target.value })} className="w-7 h-7 rounded-md cursor-pointer border-0 p-0 bg-transparent" style={{ WebkitAppearance: "none" }} />
                      <span className="text-xs text-white/35 font-mono flex-1">{data.accentColor || currentPreset.accent}</span>
                      {data.accentColor && <button onClick={() => update({ accentColor: undefined })} className="text-[10px] text-white/35 hover:text-white/55 transition-colors">Reset</button>}
                    </div>
                  </div>

                  {/* Typography */}
                  <div>
                    <div className="text-[10px] text-white/35 uppercase tracking-wider font-medium mb-2 px-1">Typography</div>
                    <div className="space-y-1">
                      {([{ id:"system",label:"System UI" },{ id:"serif",label:"Elegant Serif" },{ id:"mono",label:"Monospace" },{ id:"elegant",label:"Palatino" }] as const).map(f => (
                        <button key={f.id} onClick={() => update({ font: f.id })} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${(data.font||"system")===f.id ? "bg-white/[0.08] border border-white/[0.1] text-white" : "text-white/35 hover:bg-white/[0.02] hover:text-white/55"}`}>
                          <span style={{ fontFamily: FONTS[f.id], fontSize: 14, lineHeight: 1 }}>Aa</span>
                          <span>{f.label}</span>
                          {(data.font||"system")===f.id && <Check className="w-3 h-3 ml-auto text-white/60" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Projects layout */}
                  <div>
                    <div className="text-[10px] text-white/35 uppercase tracking-wider font-medium mb-2 px-1">Projects Layout</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(["grid","list"] as const).map(l => (
                        <button key={l} onClick={() => update({ projectLayout: l })} className={`py-2 rounded-lg text-xs font-medium transition-all ${(data.projectLayout||"grid")===l ? "bg-white/[0.07] text-white/80 border border-white/[0.1]" : "bg-white/[0.02] text-white/35 hover:text-white/55 border border-transparent"}`}>
                          {l==="grid" ? "⊞ Grid" : "☰ List"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Domain */}
                  <div>
                    <div className="text-[10px] text-white/35 uppercase tracking-wider font-medium mb-2 px-1">Domain</div>
                    <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3">
                      <div className="flex items-center text-xs mb-2">
                        <span className="text-white/35">folio.ai/</span>
                        <input value={subdomain} onChange={e => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,""))} className="bg-transparent outline-none text-white/80 font-medium w-24" />
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-emerald-400 mb-2"><Check className="w-3 h-3" /> Available</div>
                      <button onClick={() => toast("Custom domains available on Pro plan")} className="w-full text-xs text-white/40 hover:text-white/60 flex items-center gap-1 transition-colors"><Layers className="w-3 h-3" /> Connect custom domain</button>
                    </div>
                  </div>
                </div>
              ) : (
                /* CONTENT TAB */
                <div className="space-y-1">
                  <div className="text-[10px] text-white/25 uppercase tracking-wider font-medium px-1 py-2">Sections — drag to reorder</div>
                  {data.sectionOrder.map((id, idx) => {
                    const meta = getSectionMeta(id);
                    const isBuiltIn = BUILT_IN.includes(id);
                    const isActive = editSection === id;
                    return (
                      <div key={id} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all group ${isActive ? "bg-white/[0.07] border border-white/[0.1]" : "hover:bg-white/[0.04]"}`}>
                        {/* Up/Down */}
                        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button onClick={() => moveSection(id,-1)} disabled={idx===0} className="text-white/30 hover:text-white/60 disabled:opacity-20 transition-colors"><ChevronUp className="w-3 h-3" /></button>
                          <button onClick={() => moveSection(id,1)} disabled={idx===data.sectionOrder.length-1} className="text-white/30 hover:text-white/60 disabled:opacity-20 transition-colors"><ChevronDown className="w-3 h-3" /></button>
                        </div>
                        {/* Icon + label */}
                        <button onClick={() => { setEditSection(id); }} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                          <span className="text-sm flex-shrink-0">{meta.icon}</span>
                          <span className={`text-xs truncate ${isActive ? "text-white/90" : "text-white/55"}`}>{meta.label}</span>
                        </button>
                        {/* Toggle for built-in / Delete for custom */}
                        {isBuiltIn ? (
                          <button onClick={() => toggleSection(id)} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-4 h-4 rounded border border-white/30 bg-white/20 flex items-center justify-center flex-shrink-0">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          </button>
                        ) : (
                          <button onClick={() => deleteBlock(id)} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-400/50 hover:text-red-400 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {/* Hidden built-in sections */}
                  {BUILT_IN.filter(id => !data.sectionOrder.includes(id)).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/[0.05]">
                      <div className="text-[10px] text-white/20 px-1 mb-1">Hidden</div>
                      {BUILT_IN.filter(id => !data.sectionOrder.includes(id)).map(id => (
                        <div key={id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.02] transition-all group">
                          <span className="text-sm">{SECTION_META[id]?.icon}</span>
                          <span className="text-xs text-white/25 flex-1">{SECTION_META[id]?.label}</span>
                          <button onClick={() => toggleSection(id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-4 h-4 rounded border border-white/[0.2] hover:border-white/[0.4] transition-colors" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="pt-2">
                    <button onClick={() => setShowAddBlock(true)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/[0.1] text-xs text-white/35 hover:text-white/55 hover:border-white/[0.2] transition-all">
                      <Plus className="w-3.5 h-3.5" /> Add Block
                    </button>
                  </div>

                  {/* Mobile section editor - shown below section list on small screens */}
                  <div className="md:hidden mt-4 pt-4 border-t border-white/[0.06]">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-semibold text-white/80">{getSectionMeta(editSection).label}</span>
                      <span className="text-[10px] text-white/35 ml-auto">Auto-saved</span>
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.div key={editSection} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}>
                        {renderEditor()}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CENTER - hidden on mobile (left panel takes full width) */}
          {leftTab === "content" ? (
            <div className="hidden md:flex flex-1 overflow-hidden">
              <div className="w-80 border-r border-white/[0.05] bg-[#0e0e1a] overflow-y-auto flex-shrink-0">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm font-semibold text-white/80 capitalize">{getSectionMeta(editSection).label}</span>
                    <span className="text-[10px] text-white/35 ml-auto">Auto-saved</span>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div key={editSection} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}>
                      {renderEditor()}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
              {preview}
            </div>
          ) : <div className="hidden md:flex flex-1">{preview}</div>}

          {/* RIGHT PANEL - desktop only */}
          <div className="hidden md:block w-56 border-l border-white/[0.05] bg-white/[0.03] flex-shrink-0 overflow-y-auto">
            <div className="p-4 space-y-5">
              <div>
                <div className="text-[10px] text-white/35 uppercase tracking-wider font-medium mb-3">AI Content</div>
                <div className="space-y-1.5">
                  {[
                    { label:"Generate bio",       icon: Sparkles, desc:"Writes your About" },
                    { label:"Write case studies",  icon: Zap,      desc:"For first project" },
                    { label:"Add testimonials",   icon: Plus,      desc:"AI-drafted quotes" },
                    { label:"Optimize for SEO",   icon: Globe,     desc:"Keywords + meta" },
                  ].map(action => (
                    <button key={action.label} onClick={() => handleAiAction(action.label)} disabled={aiLoading}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.025] border border-white/[0.06] hover:bg-white/[0.05] transition-all text-left disabled:opacity-40 disabled:cursor-wait">
                      <action.icon className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-medium text-white/60">{action.label}</div>
                        <div className="text-[10px] text-white/35">{action.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-white/35 uppercase tracking-wider font-medium mb-3">Publish</div>
                <AnimatePresence>
                  {published ? (
                    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0"><Check className="w-3 h-3 text-white" /></div>
                        <span className="text-xs font-semibold text-emerald-400">Live!</span>
                      </div>
                      <div className="bg-white/[0.06] rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
                        <span className="text-[10px] text-cyan-400 font-mono flex-1 truncate">{typeof window !== "undefined" ? window.location.host : "localhost:3000"}/p/{subdomain}</span>
                        <ExternalLink className="w-3 h-3 text-white/35 flex-shrink-0" />
                      </div>
                      <button onClick={handlePreview} className="w-full text-xs text-white/45 hover:text-white/65 transition-colors flex items-center justify-center gap-1"><Eye className="w-3.5 h-3.5" /> Open</button>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
                      <p className="text-xs text-white/45 mb-3 leading-relaxed">Ready to go live. Hit Publish to share it.</p>
                      <button onClick={handlePublish} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-medium hover:opacity-90 transition-opacity">
                        <Zap className="w-3.5 h-3.5" /> Publish now
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div>
                <div className="text-[10px] text-white/35 uppercase tracking-wider font-medium mb-3">Analytics</div>
                <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {[{label:"Views",value:published?"1.2K":"—"},{label:"Clicks",value:published?"289":"—"}].map(s => (
                      <div key={s.label} className="text-center">
                        <div className="text-base font-bold text-white/70">{s.value}</div>
                        <div className="text-[10px] text-white/35">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <Link href="/analytics" className="text-xs text-white/40 hover:text-white/60 flex items-center gap-1 transition-colors">View analytics <ChevronRight className="w-3 h-3" /></Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
