"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, GitBranch, ExternalLink, AtSign, Link2, Edit3 } from "lucide-react";
import Link from "next/link";
import { PRESETS, FONTS, getPreset, cardBg, cardFilter, pageBackground, type Preset } from "@/lib/presets";

interface Project    { id: string; name: string; desc: string; tags: string; link: string; stars: number; image?: string }
interface SkillGroup { id: string; category: string; items: string[] }
interface ExpEntry   { id: string; role: string; company: string; period: string; desc: string }
interface Testimonial{ id: string; quote: string; name: string; jobTitle: string }
interface GalleryImage { id: string; src: string; caption: string }
interface ServiceItem  { id: string; name: string; desc: string; price: string }
interface AwardItem    { id: string; title: string; org: string; year: string }
interface PressItem    { id: string; publication: string; headline: string; url: string; year: string }

type VideoBlock    = { id: string; type: "video";    title: string; url: string; caption: string }
type GalleryBlock  = { id: string; type: "gallery";  title: string; images: GalleryImage[]; layout: "grid"|"masonry"|"row" }
type ReelBlock     = { id: string; type: "reel";     title: string; url: string }
type ServicesBlock = { id: string; type: "services"; title: string; items: ServiceItem[] }
type AwardsBlock   = { id: string; type: "awards";   title: string; items: AwardItem[] }
type PressBlock    = { id: string; type: "press";    title: string; items: PressItem[] }
type CustomBlock   = VideoBlock | GalleryBlock | ReelBlock | ServicesBlock | AwardsBlock | PressBlock

interface PortfolioData {
  portfolioType?: string;
  name: string; initials: string; title: string; bio: string;
  email: string; github: string; linkedin: string; twitter: string;
  photo?: string; accentColor?: string; font?: string;
  projectLayout?: "grid" | "list";
  projects: Project[];
  skills: SkillGroup[];
  experience: ExpEntry[];
  testimonials: Testimonial[];
  customBlocks: CustomBlock[];
  sectionOrder: string[];
}

const BUILT_IN = ["hero","projects","skills","experience","testimonials","contact"];

function toEmbedUrl(url: string): string {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0`;
  const vim = url.match(/vimeo\.com\/(\d+)/);
  if (vim) return `https://player.vimeo.com/video/${vim[1]}`;
  return url;
}

export default function PublicPortfolioPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [preset, setPreset] = useState<Preset>(PRESETS[0]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/portfolio/${subdomain}`)
      .then(r => r.json())
      .then(json => {
        if (json.error) { setNotFound(true); return; }
        setData(json.data);
        setPreset(getPreset(json.theme));
      })
      .catch(() => setNotFound(true));
  }, [subdomain]);

  if (notFound) {
    return (
      <div style={{ minHeight: "100vh", background: "#050508", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#f8f8ff", gap: 16 }}>
        <p style={{ fontSize: 48 }}>404</p>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 16 }}>This portfolio isn't published or doesn't exist.</p>
        <Link href="/" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>← Back to Folio.ai</Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", background: "#050508", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.5)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  const accent = data.accentColor || preset.accent;
  const fontFamily = FONTS[data.font || preset.font] ?? FONTS.system;
  const r = preset.radius;
  const isGrid = (data.projectLayout || "grid") === "grid";
  const tags = (str: string) => str.split(",").map(s => s.trim()).filter(Boolean);
  const initials = data.initials || data.name.split(" ").map(w => w[0]).join("").slice(0, 2) || "?";
  const sectionOrder = data.sectionOrder || BUILT_IN;
  const blockMap = Object.fromEntries((data.customBlocks || []).map(b => [b.id, b]));
  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: cardBg(preset),
    backdropFilter: cardFilter(preset),
    WebkitBackdropFilter: cardFilter(preset),
    boxShadow: preset.shadow,
    borderRadius: r,
    border: `1px solid ${preset.border}`,
    ...extra,
  });

  const renderBlock = (block: CustomBlock) => {
    switch (block.type) {
      case "reel":
        if (!block.url) return null;
        return (
          <section key={block.id} style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 96px" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: `${preset.text}35`, textTransform: "uppercase", marginBottom: 8 }}>{block.title}</p>
              <div style={{ borderRadius: 20, overflow: "hidden", aspectRatio: "16/9", background: preset.card, border: `1px solid ${preset.border}` }}>
                <iframe src={toEmbedUrl(block.url)} style={{ width: "100%", height: "100%", border: "none" }} allowFullScreen title={block.title} />
              </div>
            </motion.div>
          </section>
        );

      case "video":
        if (!block.url) return null;
        return (
          <section key={block.id} style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 96px" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              {block.title && <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.025em", margin: "0 0 24px" }}>{block.title}</h2>}
              <div style={{ borderRadius: 20, overflow: "hidden", aspectRatio: "16/9", background: preset.card, border: `1px solid ${preset.border}` }}>
                <iframe src={toEmbedUrl(block.url)} style={{ width: "100%", height: "100%", border: "none" }} allowFullScreen title={block.title} />
              </div>
              {block.caption && <p style={{ fontSize: 13, color: `${preset.text}45`, marginTop: 12, textAlign: "center" }}>{block.caption}</p>}
            </motion.div>
          </section>
        );

      case "gallery": {
        if (!block.images?.length) return null;
        const cols = block.layout === "row" ? `repeat(${block.images.length}, minmax(200px, 1fr))` : block.layout === "masonry" ? "repeat(auto-fill, minmax(260px, 1fr))" : "repeat(auto-fill, minmax(240px, 1fr))";
        return (
          <section key={block.id} style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 96px" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              {block.title && <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.025em", margin: "0 0 32px" }}>{block.title}</h2>}
              <div style={{ display: "grid", gridTemplateColumns: cols, gap: 12, overflowX: block.layout === "row" ? "auto" : undefined }}>
                {block.images.map(img => (
                  <div key={img.id} style={{ borderRadius: 14, overflow: "hidden", aspectRatio: "4/3", background: preset.card, border: `1px solid ${preset.border}` }}>
                    <img src={img.src} alt={img.caption || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            </motion.div>
          </section>
        );
      }

      case "services":
        if (!block.items?.length) return null;
        return (
          <section key={block.id} style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 96px" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              {block.title && <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.025em", margin: "0 0 32px" }}>{block.title}</h2>}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                {block.items.map(item => (
                  <div key={item.id} style={{ ...card(), padding: 28 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{item.name}</h3>
                      {item.price && <span style={{ fontSize: 14, fontWeight: 700, color: accent }}>{item.price}</span>}
                    </div>
                    <p style={{ fontSize: 13, color: `${preset.text}55`, lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>
        );

      case "awards":
        if (!block.items?.length) return null;
        return (
          <section key={block.id} style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 96px" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              {block.title && <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.025em", margin: "0 0 32px" }}>{block.title}</h2>}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {block.items.map(item => (
                  <div key={item.id} style={{ ...card(), padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ fontSize: 24 }}>🏆</span>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 2px" }}>{item.title}</h3>
                      <p style={{ fontSize: 12, color: `${preset.text}45`, margin: 0 }}>{item.org}{item.year ? ` · ${item.year}` : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>
        );

      case "press":
        if (!block.items?.length) return null;
        return (
          <section key={block.id} style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 96px" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              {block.title && <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.025em", margin: "0 0 32px" }}>{block.title}</h2>}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {block.items.map(item => (
                  <a key={item.id} href={item.url || undefined} target="_blank" rel="noreferrer"
                    style={{ ...card(), padding: 24, textDecoration: "none", display: "block", transition: "border-color 0.2s" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: accent, textTransform: "uppercase", marginBottom: 8 }}>{item.publication}</p>
                    <p style={{ fontSize: 14, color: preset.text, lineHeight: 1.5, margin: "0 0 8px", fontWeight: 500 }}>{item.headline}</p>
                    {item.year && <p style={{ fontSize: 12, color: `${preset.text}35`, margin: 0 }}>{item.year}</p>}
                  </a>
                ))}
              </div>
            </motion.div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: pageBackground(preset), color: preset.text, fontFamily }}>
      {/* Edit bar (only for convenience — users who know the URL can always go back) */}
      <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 100, display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)", padding: "8px 16px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)" }}>
        <Link href="/editor/portfolio" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>
          <Edit3 style={{ width: 13, height: 13 }} /> Edit
        </Link>
        <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.1)" }} />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{typeof window !== "undefined" ? window.location.host : ""}/p/{subdomain}</span>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
      </div>

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: `${preset.bg}e0`, backdropFilter: "blur(20px)", borderBottom: `1px solid ${preset.border}`, padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
        <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>{initials}.</span>
        <div style={{ display: "flex", gap: 32, fontSize: 13, color: `${preset.text}60` }}>
          {sectionOrder.includes("hero") && <a href="#about" style={{ color: "inherit", textDecoration: "none" }}>About</a>}
          {sectionOrder.includes("projects") && <a href="#projects" style={{ color: "inherit", textDecoration: "none" }}>Projects</a>}
          {sectionOrder.includes("skills") && <a href="#skills" style={{ color: "inherit", textDecoration: "none" }}>Skills</a>}
          {sectionOrder.includes("experience") && <a href="#experience" style={{ color: "inherit", textDecoration: "none" }}>Experience</a>}
          {sectionOrder.includes("contact") && <a href="#contact" style={{ color: "inherit", textDecoration: "none" }}>Contact</a>}
        </div>
        {sectionOrder.includes("contact") && (
          <a href={`mailto:${data.email}`} style={{ padding: "8px 18px", borderRadius: 10, background: accent, color: preset.bg, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            Hire me
          </a>
        )}
      </nav>

      {/* Sections in saved order */}
      {sectionOrder.map(id => {
        /* Built-in sections */
        if (id === "hero") return (
          <section key="hero" id="about" style={{ maxWidth: 800, margin: "0 auto", padding: "100px 24px 80px", textAlign: "center" }}>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div style={{ width: 96, height: 96, borderRadius: 24, overflow: "hidden", background: data.photo ? "transparent" : `linear-gradient(135deg, ${accent}, ${accent}70)`, margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: preset.bg, boxShadow: `0 0 60px ${accent}40` }}>
                {data.photo ? <img src={data.photo} alt={data.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
              </div>
              <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700, letterSpacing: "-0.035em", margin: "0 0 12px", lineHeight: 1.1 }}>{data.name}</h1>
              <p style={{ fontSize: 18, color: `${preset.text}65`, margin: "0 0 20px" }}>{data.title}</p>
              <p style={{ fontSize: 16, color: `${preset.text}50`, maxWidth: 540, margin: "0 auto 36px", lineHeight: 1.75 }}>{data.bio}</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
                {sectionOrder.includes("contact") && (
                  <a href={`mailto:${data.email}`} style={{ padding: "12px 28px", borderRadius: 12, background: accent, color: preset.bg, fontSize: 14, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <Mail style={{ width: 16, height: 16 }} /> Contact me
                  </a>
                )}
                {data.github && (
                  <a href={`https://${data.github}`} target="_blank" rel="noreferrer" style={{ padding: "12px 28px", borderRadius: 12, background: "transparent", border: `1px solid ${preset.border}`, color: preset.text, fontSize: 14, fontWeight: 500, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <GitBranch style={{ width: 16, height: 16 }} /> GitHub
                  </a>
                )}
              </div>
            </motion.div>
          </section>
        );

        if (id === "projects" && data.projects.length > 0) return (
          <section key="projects" id="projects" style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 96px" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: `${preset.text}35`, textTransform: "uppercase", marginBottom: 8 }}>Work</p>
              <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.025em", margin: "0 0 40px" }}>Featured Projects</h2>
              <div style={{ display: "grid", gridTemplateColumns: isGrid ? "repeat(auto-fill, minmax(300px, 1fr))" : "1fr", gap: 20 }}>
                {data.projects.map((proj, i) => (
                  <motion.div key={proj.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                    style={{ ...card(), overflow: "hidden" }}>
                    {proj.image && <img src={proj.image} alt={proj.name} style={{ width: "100%", height: 200, objectFit: "cover" }} />}
                    <div style={{ padding: 28 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{proj.name}</h3>
                        {proj.link && <a href={`https://${proj.link}`} target="_blank" rel="noreferrer" style={{ color: `${preset.text}30` }}><ExternalLink style={{ width: 16, height: 16 }} /></a>}
                      </div>
                      <p style={{ fontSize: 13, color: `${preset.text}55`, lineHeight: 1.7, marginBottom: 16 }}>{proj.desc}</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {tags(proj.tags).map(t => <span key={t} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: `${accent}18`, color: accent, border: `1px solid ${accent}30` }}>{t}</span>)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </section>
        );

        if (id === "skills" && data.skills.length > 0) return (
          <section key="skills" id="skills" style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 96px" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: `${preset.text}35`, textTransform: "uppercase", marginBottom: 8 }}>Expertise</p>
              <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.025em", margin: "0 0 40px" }}>Skills</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
                {data.skills.map(group => (
                  <div key={group.id} style={{ ...card(), padding: 24 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: accent, textTransform: "uppercase", marginBottom: 16 }}>{group.category}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {group.items.map(item => <span key={item} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, background: `${preset.text}08`, color: `${preset.text}75`, border: `1px solid ${preset.border}` }}>{item}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>
        );

        if (id === "experience" && data.experience.length > 0) return (
          <section key="experience" id="experience" style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 96px" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: `${preset.text}35`, textTransform: "uppercase", marginBottom: 8 }}>Career</p>
              <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.025em", margin: "0 0 40px" }}>Experience</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {data.experience.map(exp => (
                  <div key={exp.id} style={{ ...card(), padding: 28 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
                      <h3 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>{exp.role}</h3>
                      <span style={{ fontSize: 12, color: `${preset.text}40`, background: `${preset.text}08`, padding: "3px 10px", borderRadius: 20 }}>{exp.period}</span>
                    </div>
                    <p style={{ fontSize: 14, color: accent, margin: "0 0 12px", fontWeight: 500 }}>{exp.company}</p>
                    <p style={{ fontSize: 14, color: `${preset.text}55`, lineHeight: 1.7, margin: 0 }}>{exp.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>
        );

        if (id === "testimonials" && data.testimonials.length > 0) return (
          <section key="testimonials" style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 96px" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: `${preset.text}35`, textTransform: "uppercase", marginBottom: 8 }}>Praise</p>
              <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.025em", margin: "0 0 40px" }}>What people say</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
                {data.testimonials.map(t => (
                  <div key={t.id} style={{ ...card(), padding: 28 }}>
                    <p style={{ fontSize: 14, color: `${preset.text}70`, lineHeight: 1.8, marginBottom: 20, fontStyle: "italic" }}>"{t.quote}"</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: accent }}>
                        {t.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{t.name}</p>
                        <p style={{ fontSize: 12, color: `${preset.text}40`, margin: 0 }}>{t.jobTitle}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>
        );

        if (id === "contact") return (
          <section key="contact" id="contact" style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 120px" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div style={{ ...card(), padding: "56px 40px", textAlign: "center" }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: `${preset.text}35`, textTransform: "uppercase", marginBottom: 12 }}>Get in touch</p>
                <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 700, letterSpacing: "-0.025em", margin: "0 0 16px", lineHeight: 1.15 }}>Let's work together</h2>
                <a href={`mailto:${data.email}`} style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 32px", borderRadius: 14, background: accent, color: preset.bg, fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
                  <Mail style={{ width: 18, height: 18 }} /> {data.email}
                </a>
                <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 28, flexWrap: "wrap" }}>
                  {data.github && <a href={`https://${data.github}`} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: `${preset.text}45`, textDecoration: "none" }}><GitBranch style={{ width: 15, height: 15 }} /> GitHub</a>}
                  {data.linkedin && <a href={`https://${data.linkedin}`} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: `${preset.text}45`, textDecoration: "none" }}><Link2 style={{ width: 15, height: 15 }} /> LinkedIn</a>}
                  {data.twitter && <a href={`https://twitter.com/${data.twitter.replace("@", "")}`} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: `${preset.text}45`, textDecoration: "none" }}><AtSign style={{ width: 15, height: 15 }} /> Twitter</a>}
                </div>
              </div>
            </motion.div>
          </section>
        );

        /* Custom blocks */
        const block = blockMap[id];
        if (block) return renderBlock(block);
        return null;
      })}

      <footer style={{ borderTop: `1px solid ${preset.border}`, padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontSize: 13, color: `${preset.text}30`, fontWeight: 600 }}>{initials}.</span>
        <span style={{ fontSize: 12, color: `${preset.text}25` }}>Built with <span style={{ color: accent }}>Folio.ai</span></span>
      </footer>
    </div>
  );
}
