"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, GitBranch, ExternalLink, AtSign, Link2, ArrowLeft, Zap, Globe } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { PRESETS, FONTS, getPreset, cardBg, cardFilter, pageBackground, type Preset } from "@/lib/presets";

interface Project { id: string; name: string; desc: string; tags: string; link: string; stars: number; image?: string }
interface SkillGroup { id: string; category: string; items: string[] }
interface ExpEntry { id: string; role: string; company: string; period: string; desc: string }
interface Testimonial { id: string; quote: string; name: string; jobTitle: string }
interface PortfolioData {
  name: string; initials: string; title: string; bio: string;
  email: string; github: string; linkedin: string; twitter: string;
  photo?: string; accentColor?: string; font?: string;
  projectLayout?: "grid" | "list";
  projects: Project[];
  skills: SkillGroup[];
  experience: ExpEntry[];
  testimonials: Testimonial[];
  sectionOrder?: string[];
}

const DEFAULT_DATA: PortfolioData = {
  name: "John Doe", initials: "JD", title: "Senior Frontend Engineer",
  bio: "Building high-performance web applications with React, TypeScript, and modern tooling.",
  email: "john@example.com", github: "github.com/johndoe", linkedin: "linkedin.com/in/johndoe", twitter: "@johndoe",
  projects: [], skills: [], experience: [], testimonials: [],
};

export default function PortfolioPreviewPage() {
  const [data, setData] = useState<PortfolioData>(DEFAULT_DATA);
  const [preset, setPreset] = useState<Preset>(PRESETS[0]);
  const [sections, setSections] = useState(["hero", "projects", "skills", "experience", "contact"]);
  const [subdomain, setSubdomain] = useState("johndev");
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/user/portfolio")
      .then(r => r.json())
      .then(json => {
        if (json.data) {
          setData({ ...DEFAULT_DATA, ...json.data });
          setPreset(getPreset(json.theme));
          if (json.data.sectionOrder) setSections(json.data.sectionOrder);
          if (json.subdomain) setSubdomain(json.subdomain);
          if (json.published !== undefined) setPublished(json.published);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const togglePublish = async () => {
    setPublishing(true);
    const next = !published;
    try {
      const portfolioRes = await fetch("/api/user/portfolio").then(r => r.json());
      await fetch("/api/user/portfolio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: portfolioRes.data, theme: portfolioRes.theme, subdomain, published: next }),
      });
      setPublished(next);
      if (next) toast.success("Portfolio published!", { description: `Live at /p/${subdomain}` });
      else toast.success("Portfolio unpublished — it's now private");
    } catch {
      toast.error("Could not update publish status");
    } finally {
      setPublishing(false);
    }
  };

  const show = (id: string) => sections.includes(id);
  const tags = (str: string) => str.split(",").map(s => s.trim()).filter(Boolean);
  const initials = data.initials || data.name.split(" ").map(w => w[0]).join("").slice(0, 2) || "JD";
  const accent = data.accentColor || preset.accent;
  const fontFamily = FONTS[data.font || preset.font] ?? FONTS.system;
  const isGrid = (data.projectLayout || "grid") === "grid";
  const r = preset.radius;
  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: cardBg(preset),
    backdropFilter: cardFilter(preset),
    WebkitBackdropFilter: cardFilter(preset),
    boxShadow: preset.shadow,
    borderRadius: r,
    border: `1px solid ${preset.border}`,
    ...extra,
  });

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", background: "#050508", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: pageBackground(preset), color: preset.text, fontFamily }}>
      {/* Edit bar */}
      <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 100, display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", padding: "6px 8px 6px 16px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)" }}>
        <Link href="/editor/portfolio" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>
          <ArrowLeft style={{ width: 13, height: 13 }} /> Edit
        </Link>
        <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.1)" }} />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>folio.ai/{subdomain}</span>
        {published && (
          <a href={`/p/${subdomain}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#34d399", textDecoration: "none" }}>
            <ExternalLink style={{ width: 11, height: 11 }} /> View Live
          </a>
        )}
        <button
          onClick={togglePublish}
          disabled={publishing}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 999, fontSize: 11, fontWeight: 600, border: "none", cursor: publishing ? "wait" : "pointer", transition: "all 0.15s", background: published ? "rgba(239,68,68,0.15)" : "linear-gradient(135deg, #0891b2, #2563eb)", color: published ? "#f87171" : "#fff", opacity: publishing ? 0.6 : 1 }}
        >
          {published
            ? <><Globe style={{ width: 11, height: 11 }} /> Unpublish</>
            : <><Zap style={{ width: 11, height: 11 }} /> Publish</>}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: `${preset.bg}e0`, backdropFilter: "blur(20px)", borderBottom: `1px solid ${preset.border}`, padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
        <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>{initials}.</span>
        <div style={{ display: "flex", gap: 32, fontSize: 13, color: `${preset.text}60` }}>
          {show("hero") && <a href="#about" style={{ color: "inherit", textDecoration: "none" }}>About</a>}
          {show("projects") && <a href="#projects" style={{ color: "inherit", textDecoration: "none" }}>Projects</a>}
          {show("skills") && <a href="#skills" style={{ color: "inherit", textDecoration: "none" }}>Skills</a>}
          {show("experience") && <a href="#experience" style={{ color: "inherit", textDecoration: "none" }}>Experience</a>}
          {show("contact") && <a href="#contact" style={{ color: "inherit", textDecoration: "none" }}>Contact</a>}
        </div>
        {show("contact") && (
          <a href={`mailto:${data.email}`} style={{ padding: "8px 18px", borderRadius: 10, background: accent, color: preset.bg, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            Hire me
          </a>
        )}
      </nav>

      {/* Hero */}
      {show("hero") && (
        <section id="about" style={{ maxWidth: 800, margin: "0 auto", padding: "100px 24px 80px", textAlign: "center" }}>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div style={{ width: 96, height: 96, borderRadius: 24, overflow: "hidden", background: data.photo ? "transparent" : `linear-gradient(135deg, ${accent}, ${accent}70)`, margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: preset.bg, boxShadow: `0 0 60px ${accent}40` }}>
              {data.photo
                ? <img src={data.photo} alt={data.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : initials
              }
            </div>
            <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700, letterSpacing: "-0.035em", margin: "0 0 12px", lineHeight: 1.1 }}>{data.name}</h1>
            <p style={{ fontSize: 18, color: `${preset.text}65`, margin: "0 0 20px", fontWeight: 400 }}>{data.title}</p>
            <p style={{ fontSize: 16, color: `${preset.text}50`, maxWidth: 540, margin: "0 auto 36px", lineHeight: 1.75 }}>{data.bio}</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              {show("contact") && (
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
      )}

      {/* Projects */}
      {show("projects") && data.projects.length > 0 && (
        <section id="projects" style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 96px" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: `${preset.text}35`, textTransform: "uppercase", marginBottom: 8 }}>Work</p>
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.025em", margin: "0 0 40px" }}>Featured Projects</h2>
            <div style={{ display: "grid", gridTemplateColumns: isGrid ? "repeat(auto-fill, minmax(300px, 1fr))" : "1fr", gap: 20 }}>
              {data.projects.map((proj, i) => (
                <motion.div key={proj.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  style={{ borderRadius: 18, background: preset.card, border: `1px solid ${preset.border}`, overflow: "hidden", display: "flex", flexDirection: isGrid ? "column" : "row" }}>
                  {proj.image && (
                    <div style={{ flexShrink: 0, overflow: "hidden", height: isGrid ? 200 : 140, width: isGrid ? "100%" : 220 }}>
                      <img src={proj.image} alt={proj.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <div style={{ padding: 28, display: "flex", flexDirection: "column", flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, lineHeight: 1.3 }}>{proj.name}</h3>
                      {proj.link && (
                        <a href={`https://${proj.link}`} target="_blank" rel="noreferrer" style={{ color: `${preset.text}30`, display: "flex" }}>
                          <ExternalLink style={{ width: 16, height: 16 }} />
                        </a>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: `${preset.text}55`, lineHeight: 1.7, marginBottom: 18, flex: 1 }}>{proj.desc}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                      {tags(proj.tags).map(t => (
                        <span key={t} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: `${accent}18`, color: accent, border: `1px solid ${accent}30` }}>{t}</span>
                      ))}
                    </div>
                    {proj.stars > 0 && (
                      <div style={{ fontSize: 12, color: `${preset.text}30`, display: "flex", alignItems: "center", gap: 5 }}>
                        <GitBranch style={{ width: 13, height: 13 }} /> {proj.stars.toLocaleString()} stars
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* Skills */}
      {show("skills") && data.skills.length > 0 && (
        <section id="skills" style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 96px" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: `${preset.text}35`, textTransform: "uppercase", marginBottom: 8 }}>Expertise</p>
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.025em", margin: "0 0 40px" }}>Skills</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
              {data.skills.map((group, i) => (
                <motion.div key={group.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                  style={{ borderRadius: 18, background: preset.card, border: `1px solid ${preset.border}`, padding: 24 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: accent, textTransform: "uppercase", marginBottom: 16 }}>{group.category}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {group.items.map(item => (
                      <span key={item} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, background: `${preset.text}08`, color: `${preset.text}75`, border: `1px solid ${preset.border}` }}>{item}</span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* Experience */}
      {show("experience") && data.experience.length > 0 && (
        <section id="experience" style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 96px" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: `${preset.text}35`, textTransform: "uppercase", marginBottom: 8 }}>Career</p>
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.025em", margin: "0 0 40px" }}>Experience</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {data.experience.map((exp, i) => (
                <motion.div key={exp.id} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  style={{ borderRadius: 18, background: preset.card, border: `1px solid ${preset.border}`, padding: 28 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>{exp.role}</h3>
                    <span style={{ fontSize: 12, color: `${preset.text}40`, background: `${preset.text}08`, padding: "3px 10px", borderRadius: 20 }}>{exp.period}</span>
                  </div>
                  <p style={{ fontSize: 14, color: accent, margin: "0 0 12px", fontWeight: 500 }}>{exp.company}</p>
                  <p style={{ fontSize: 14, color: `${preset.text}55`, lineHeight: 1.7, margin: 0 }}>{exp.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* Testimonials */}
      {show("testimonials") && data.testimonials.length > 0 && (
        <section id="testimonials" style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 96px" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: `${preset.text}35`, textTransform: "uppercase", marginBottom: 8 }}>Praise</p>
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.025em", margin: "0 0 40px" }}>What people say</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
              {data.testimonials.map((t, i) => (
                <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  style={{ borderRadius: 18, background: preset.card, border: `1px solid ${preset.border}`, padding: 28 }}>
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
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* Contact */}
      {show("contact") && (
        <section id="contact" style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 120px" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div style={{ borderRadius: 24, background: preset.card, border: `1px solid ${preset.border}`, padding: "56px 40px", textAlign: "center" }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: `${preset.text}35`, textTransform: "uppercase", marginBottom: 12 }}>Get in touch</p>
              <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 700, letterSpacing: "-0.025em", margin: "0 0 16px", lineHeight: 1.15 }}>Let's work together</h2>
              <p style={{ fontSize: 16, color: `${preset.text}50`, maxWidth: 400, margin: "0 auto 36px", lineHeight: 1.7 }}>
                Open to freelance, full-time, or consulting opportunities.
              </p>
              <a href={`mailto:${data.email}`} style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 32px", borderRadius: 14, background: accent, color: preset.bg, fontSize: 15, fontWeight: 600, textDecoration: "none", boxShadow: `0 8px 40px ${accent}40` }}>
                <Mail style={{ width: 18, height: 18 }} /> {data.email}
              </a>
              <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 28, flexWrap: "wrap" }}>
                {data.github && (
                  <a href={`https://${data.github}`} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: `${preset.text}45`, textDecoration: "none" }}>
                    <GitBranch style={{ width: 15, height: 15 }} /> GitHub
                  </a>
                )}
                {data.linkedin && (
                  <a href={`https://${data.linkedin}`} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: `${preset.text}45`, textDecoration: "none" }}>
                    <Link2 style={{ width: 15, height: 15 }} /> LinkedIn
                  </a>
                )}
                {data.twitter && (
                  <a href={`https://twitter.com/${data.twitter.replace("@", "")}`} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: `${preset.text}45`, textDecoration: "none" }}>
                    <AtSign style={{ width: 15, height: 15 }} /> AtSign
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${preset.border}`, padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontSize: 13, color: `${preset.text}30`, fontWeight: 600 }}>{initials}.</span>
        <span style={{ fontSize: 12, color: `${preset.text}25` }}>Built with <span style={{ color: preset.accent }}>Folio.ai</span></span>
        <Link href="/editor/portfolio" style={{ fontSize: 12, color: preset.accent, textDecoration: "none", opacity: 0.7 }}>Edit portfolio →</Link>
      </footer>
    </div>
  );
}
