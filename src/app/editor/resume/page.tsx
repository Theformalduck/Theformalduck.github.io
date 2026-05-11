"use client";

import { useState, useCallback, useRef, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Download, Eye, Share2, Wand2, Check, RotateCcw,
  Target, ArrowLeft, X, Plus, Trash2, GripVertical, Zap, Save, Upload,
  User, AlignLeft, Briefcase, BookOpen, Layers, LayoutTemplate,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import DashboardSidebar from "@/components/DashboardSidebar";
import { computeScore } from "@/lib/scoring";

/* ── Types ── */
interface Bullet { id: string; text: string }
interface ExpEntry { id: string; company: string; role: string; period: string; bullets: Bullet[] }
interface EduEntry { id: string; school: string; degree: string; period: string; gpa: string }
interface Project   { id: string; name: string; desc: string; link: string; tags: string }
interface SkillGroup { id: string; category: string; items: string[] }

interface ResumeData {
  name: string; title: string; email: string; phone: string;
  location: string; website: string; linkedin: string; github: string;
  summary: string;
  experience: ExpEntry[];
  education: EduEntry[];
  skills: SkillGroup[];
  projects: Project[];
}

const uid = () => Math.random().toString(36).slice(2, 9);

const AI_REWRITES: Record<string, string> = {
  professional: "Engineered a real-time analytics dashboard serving 50+ retail locations, integrating Chart.js with REST APIs to reduce manual reporting time by 73% and increase data accuracy to 99.2%.",
  technical:    "Built a React + Node.js real-time analytics system with WebSocket streaming, serving 50+ enterprise clients across distributed infrastructure with 99.9% uptime.",
  creative:     "Transformed raw data into stunning dashboards that turned heads in boardrooms across 50+ retail locations — making numbers beautiful and decisions effortless.",
  startup:      "Shipped a full-stack analytics dashboard fast, onboarded 50+ stores in 3 weeks, and cut manual reporting from hours to seconds.",
  corporate:    "Developed and deployed an enterprise-grade business intelligence dashboard supporting 50+ retail locations, resulting in a 73% reduction in operational reporting overhead.",
};

const SECTION_LABELS = [
  { id: "basics",     label: "Personal Info", icon: User },
  { id: "summary",    label: "Summary",       icon: AlignLeft },
  { id: "experience", label: "Experience",    icon: Briefcase },
  { id: "education",  label: "Education",     icon: BookOpen },
  { id: "skills",     label: "Skills",        icon: Zap },
  { id: "projects",   label: "Projects",      icon: Layers },
];

const MODES = [
  { id: "professional", label: "Professional", cls: "text-white/80 bg-white/[0.08] border-white/[0.12]" },
  { id: "technical",    label: "Technical",    cls: "text-cyan-300 bg-cyan-500/10 border-cyan-500/20" },
  { id: "creative",     label: "Creative",     cls: "text-pink-300 bg-pink-500/10 border-pink-500/20" },
  { id: "startup",      label: "Startup",      cls: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" },
  { id: "corporate",    label: "Corporate",    cls: "text-amber-300 bg-amber-500/10 border-amber-500/20" },
];

/* ── Resume templates ── */
interface TemplateStyle {
  id: string; label: string; desc: string;
  bg: string; headerBg?: string; headerText?: string;
  bodyText: string; mutedText: string; accentText: string;
  sectionLabel: string; divider: string;
  tagBg: string; tagText: string;
  fontFamily?: string;
}

const RESUME_TEMPLATES: TemplateStyle[] = [
  { id: "classic",   label: "Classic",   desc: "Traditional ATS-safe",
    bg: "#ffffff", bodyText: "#1a1a1a", mutedText: "#6b7280", accentText: "#374151",
    sectionLabel: "#9ca3af", divider: "#e5e7eb", tagBg: "#f3f4f6", tagText: "#6b7280" },
  { id: "modern",    label: "Modern",    desc: "Clean blue accent",
    bg: "#ffffff", bodyText: "#0f172a", mutedText: "#475569", accentText: "#1d4ed8",
    sectionLabel: "#1d4ed8", divider: "#e2e8f0", tagBg: "#eff6ff", tagText: "#1d4ed8" },
  { id: "minimal",   label: "Minimal",   desc: "Ultra-clean whitespace",
    bg: "#ffffff", bodyText: "#111111", mutedText: "#888888", accentText: "#333333",
    sectionLabel: "#cccccc", divider: "#f0f0f0", tagBg: "#fafafa", tagText: "#888888" },
  { id: "executive", label: "Executive", desc: "Dark header, bold presence",
    bg: "#ffffff", headerBg: "#111827", headerText: "#ffffff",
    bodyText: "#111827", mutedText: "#6b7280", accentText: "#111827",
    sectionLabel: "#111827", divider: "#e5e7eb", tagBg: "#f9fafb", tagText: "#374151" },
  { id: "tech",      label: "Tech",      desc: "Developer-focused, green",
    bg: "#f8fafc", bodyText: "#0f172a", mutedText: "#64748b", accentText: "#059669",
    sectionLabel: "#059669", divider: "#e2e8f0", tagBg: "#ecfdf5", tagText: "#065f46",
    fontFamily: "'Courier New', Courier, monospace" },
  { id: "bold",      label: "Bold",      desc: "Strong red accent",
    bg: "#ffffff", bodyText: "#111111", mutedText: "#6b7280", accentText: "#dc2626",
    sectionLabel: "#dc2626", divider: "#fee2e2", tagBg: "#fff1f2", tagText: "#dc2626" },
];

const DEFAULT: ResumeData = {
  name: "John Doe", title: "Software Engineer", email: "john@example.com",
  phone: "+1 (555) 000-0000", location: "San Francisco, CA", website: "johndev.io",
  linkedin: "linkedin.com/in/johndoe", github: "github.com/johndoe",
  summary: "Senior Frontend Engineer with 4+ years building high-performance web applications. Specialising in React, TypeScript, and distributed systems. Passionate about developer experience and shipping products users love.",
  experience: [
    {
      id: uid(), company: "Acme Corp", role: "Senior Frontend Engineer", period: "Jan 2023 – Present",
      bullets: [
        { id: uid(), text: "Engineered a real-time analytics dashboard serving 50+ retail locations, reducing manual reporting time by 73%." },
        { id: uid(), text: "Led migration from REST to GraphQL, improving API response times by 45% and reducing payload size by 60%." },
        { id: uid(), text: "Mentored 3 junior engineers via weekly code reviews, establishing team coding standards." },
      ],
    },
    {
      id: uid(), company: "Startup XYZ", role: "Frontend Developer", period: "Mar 2021 – Dec 2022",
      bullets: [
        { id: uid(), text: "Built and maintained 15+ React components used across 4 product lines." },
        { id: uid(), text: "Implemented CI/CD pipeline with GitHub Actions, cutting deploy time by 80%." },
      ],
    },
  ],
  education: [
    { id: uid(), school: "University of California, Berkeley", degree: "B.S. Computer Science", period: "2017 – 2021", gpa: "3.8" },
  ],
  skills: [
    { id: uid(), category: "Frontend",  items: ["React", "TypeScript", "Next.js", "Tailwind CSS"] },
    { id: uid(), category: "Backend",   items: ["Node.js", "Python", "PostgreSQL", "Redis"] },
    { id: uid(), category: "DevOps",    items: ["Docker", "AWS", "CI/CD", "Kubernetes"] },
  ],
  projects: [
    { id: uid(), name: "AI Analytics Dashboard", desc: "Real-time data visualization platform serving 50+ enterprise clients with WebSocket streaming.", link: "github.com/johndoe/analytics", tags: "React, D3.js, Node.js, WebSockets" },
    { id: uid(), name: "Open-Source UI Library", desc: "Component library with 40+ accessible React components. 2K+ GitHub stars.", link: "github.com/johndoe/ui-lib", tags: "TypeScript, Storybook, Jest" },
  ],
};

/* ── Resume document renderer (used in preview + print) ── */
function SectionBlock({ label, tmpl, children }: { label: string; tmpl: TemplateStyle; children: React.ReactNode }) {
  const ff = tmpl.fontFamily || "system-ui,-apple-system,sans-serif";
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ borderBottom: `1px solid ${tmpl.divider}`, marginBottom: 10, paddingBottom: 4 }}>
        <h2 style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: tmpl.sectionLabel, margin: 0, textTransform: "uppercase", fontFamily: ff }}>{label}</h2>
      </div>
      {children}
    </div>
  );
}

function ResumeDoc({ data, tmpl }: { data: ResumeData; tmpl: TemplateStyle }) {
  const ff = tmpl.fontFamily || "system-ui,-apple-system,sans-serif";
  return (
    <div style={{ background: tmpl.bg, color: tmpl.bodyText, fontFamily: ff }}>
      {/* Header */}
      {tmpl.headerBg ? (
        <div style={{ background: tmpl.headerBg, color: tmpl.headerText, padding: "32px 40px 28px", marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>{data.name}</h1>
          <p style={{ fontSize: 13, opacity: 0.7, margin: "0 0 6px" }}>{data.title}</p>
          <p style={{ fontSize: 11, opacity: 0.5, margin: 0 }}>{[data.email, data.phone, data.location].filter(Boolean).join(" · ")}</p>
        </div>
      ) : (
        <div style={{ padding: "32px 40px 0", marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em", color: tmpl.bodyText, fontFamily: ff }}>{data.name}</h1>
          <p style={{ fontSize: 13, color: tmpl.mutedText, margin: "0 0 4px" }}>{data.title}</p>
          <p style={{ fontSize: 11, color: tmpl.mutedText, margin: 0 }}>{[data.email, data.phone, data.location].filter(Boolean).join(" · ")}</p>
        </div>
      )}
      <div style={{ padding: tmpl.headerBg ? "0 40px 32px" : "0 40px 32px" }}>
        {data.summary && (
          <SectionBlock label="Summary" tmpl={tmpl}>
            <p style={{ fontSize: 12, color: tmpl.mutedText, lineHeight: 1.7, margin: 0 }}>{data.summary}</p>
          </SectionBlock>
        )}
        <SectionBlock label="Experience" tmpl={tmpl}>
          {data.experience.map(e => (
            <div key={e.id} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{e.role}</span>
                <span style={{ fontSize: 11, color: tmpl.mutedText }}>{e.period}</span>
              </div>
              <p style={{ fontSize: 11, color: tmpl.accentText, margin: "0 0 6px", fontWeight: 500 }}>{e.company}</p>
              <ul style={{ paddingLeft: 14, margin: 0 }}>
                {e.bullets.filter(b => b.text).map(b => (
                  <li key={b.id} style={{ fontSize: 11, color: tmpl.mutedText, marginBottom: 3, lineHeight: 1.55 }}>{b.text}</li>
                ))}
              </ul>
            </div>
          ))}
        </SectionBlock>
        <SectionBlock label="Skills" tmpl={tmpl}>
          {data.skills.map(g => (
            <div key={g.id} style={{ marginBottom: 6, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "baseline" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: tmpl.bodyText, minWidth: 72, textTransform: "uppercase", letterSpacing: "0.05em" }}>{g.category}</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {g.items.map(item => (
                  <span key={item} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: tmpl.tagBg, color: tmpl.tagText }}>{item}</span>
                ))}
              </div>
            </div>
          ))}
        </SectionBlock>
        <SectionBlock label="Education" tmpl={tmpl}>
          {data.education.map(e => (
            <div key={e.id} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{e.school}</span>
                <span style={{ fontSize: 11, color: tmpl.mutedText }}>{e.period}</span>
              </div>
              <p style={{ fontSize: 11, color: tmpl.mutedText, margin: 0 }}>{e.degree}{e.gpa ? ` · GPA: ${e.gpa}` : ""}</p>
            </div>
          ))}
        </SectionBlock>
        {data.projects.length > 0 && (
          <SectionBlock label="Projects" tmpl={tmpl}>
            {data.projects.map(p => (
              <div key={p.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                  {p.link && <span style={{ fontSize: 10, color: tmpl.mutedText }}>{p.link}</span>}
                </div>
                <p style={{ fontSize: 11, color: tmpl.mutedText, margin: "2px 0 6px" }}>{p.desc}</p>
                {p.tags && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {p.tags.split(",").map(t => <span key={t} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: tmpl.tagBg, color: tmpl.tagText }}>{t.trim()}</span>)}
                  </div>
                )}
              </div>
            ))}
          </SectionBlock>
        )}
      </div>
    </div>
  );
}

/* ── Score ring ── */
function ScoreRing({ score }: { score: number }) {
  const r = 36, c = 2 * Math.PI * r;
  const color = score >= 85 ? "#10b981" : score >= 70 ? "rgba(255,255,255,0.65)" : "#f59e0b";
  return (
    <div className="relative" style={{ width: 88, height: 88 }}>
      <svg width="88" height="88" className="-rotate-90">
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
        <motion.circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (score / 100) * c }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold" style={{ color }}>{score}</span>
        <span className="text-[9px] text-white/30">ATS</span>
      </div>
    </div>
  );
}

/* ── Main component (inner, needs useSearchParams) ── */
function ResumeEditorInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const resumeId = searchParams.get("id");

  const [data, setData]           = useState<ResumeData>(DEFAULT);
  const [section, setSection]     = useState("experience");
  const [mode, setMode]           = useState("professional");
  const [aiOpen, setAiOpen]       = useState(true);
  const [preview, setPreview]     = useState(false);
  const [suggestion, setSugg]     = useState<{ entryId: string; bulletId: string; text: string } | null>(null);
  const [summarySugg, setSummarySugg] = useState<string | null>(null);
  const [projSugg, setProjSugg]   = useState<{ projId: string; text: string } | null>(null);
  const [jobDesc, setJobDesc]     = useState("");
  const [jobScore, setJobScore]   = useState<number | null>(null);
  const [newSkill, setNewSkill]   = useState<Record<string, string>>({});
  const [addingSkillFor, setAddingSkillFor] = useState<string | null>(null);
  const [saved, setSaved]         = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [templateId, setTemplateId] = useState("classic");
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const score = useMemo(() => computeScore(data), [data]);

  const [loaded, setLoaded] = useState(false);
  const userEdited = useRef(false);

  /* Load resume by ID, or find/create one if no ID in URL */
  useEffect(() => {
    if (resumeId) {
      fetch(`/api/user/resumes/${resumeId}`)
        .then(r => r.json())
        .then(json => {
          if (json.data) setData(json.data);
          /* if data is null (brand-new resume), DEFAULT stays — user fills it in */
        })
        .catch(() => {})
        .finally(() => setLoaded(true));
    } else {
      /* No ID — redirect to the most recent resume, or create one */
      fetch("/api/user/resumes")
        .then(r => r.json())
        .then(async json => {
          if (json.resumes?.length > 0) {
            router.replace(`/editor/resume?id=${json.resumes[0].id}`);
          } else {
            const res = await fetch("/api/user/resumes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ label: "My Resume", data: DEFAULT }),
            });
            const created = await res.json();
            if (created.id) router.replace(`/editor/resume?id=${created.id}`);
            else setLoaded(true);
          }
        })
        .catch(() => setLoaded(true));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId]);

  const apiUrl = resumeId ? `/api/user/resumes/${resumeId}` : null;

  const save = useCallback(() => {
    if (!apiUrl) return;
    fetch(apiUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    }).catch(() => {});
    setSaved(true);
    toast.success("Resume saved!");
    setTimeout(() => setSaved(false), 2000);
  }, [data, apiUrl]);

  /* Auto-save on data change (after initial load, only once user has edited) */
  useEffect(() => {
    if (!loaded || !apiUrl || !userEdited.current) return;
    const id = setTimeout(() => {
      fetch(apiUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      }).catch(() => {});
    }, 800);
    return () => clearTimeout(id);
  }, [data, loaded, apiUrl]);

  /* Field helpers */
  const edit = useCallback((fn: (prev: ResumeData) => ResumeData) => {
    userEdited.current = true;
    setData(fn);
  }, []);
  const setField = (k: keyof ResumeData, v: string) => edit(p => ({ ...p, [k]: v }));

  /* Experience */
  const setExpField = (id: string, k: keyof ExpEntry, v: string) =>
    edit(p => ({ ...p, experience: p.experience.map(e => e.id === id ? { ...e, [k]: v } : e) }));
  const setBullet = (expId: string, bId: string, text: string) =>
    edit(p => ({ ...p, experience: p.experience.map(e => e.id === expId ? { ...e, bullets: e.bullets.map(b => b.id === bId ? { ...b, text } : b) } : e) }));
  const addBullet = (expId: string) =>
    edit(p => ({ ...p, experience: p.experience.map(e => e.id === expId ? { ...e, bullets: [...e.bullets, { id: uid(), text: "" }] } : e) }));
  const deleteBullet = (expId: string, bId: string) =>
    edit(p => ({ ...p, experience: p.experience.map(e => e.id === expId ? { ...e, bullets: e.bullets.filter(b => b.id !== bId) } : e) }));
  const deleteExp = (id: string) =>
    edit(p => ({ ...p, experience: p.experience.filter(e => e.id !== id) }));
  const addExp = () =>
    edit(p => ({ ...p, experience: [...p.experience, { id: uid(), company: "Company Name", role: "Job Title", period: "Start – End", bullets: [{ id: uid(), text: "" }] }] }));
  const acceptSuggestion = () => {
    if (!suggestion) return;
    setBullet(suggestion.entryId, suggestion.bulletId, suggestion.text);
    setSugg(null);
    toast.success("Bullet updated!");
  };

  const aiSuggestProject = async (projId: string) => {
    const proj = data.projects.find(p => p.id === projId);
    if (!proj) return;
    setProjSugg(null);
    setAiLoading(true);
    const toastId = toast.loading("Generating AI suggestion…");
    try {
      const res = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bullet: proj.desc || proj.name,
          mode,
          role: proj.name,
          company: proj.tags || "personal project",
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setProjSugg({ projId, text: json.text });
      toast.dismiss(toastId);
      toast.success("AI suggestion ready ✨");
    } catch {
      toast.dismiss(toastId);
      toast.error("AI request failed — check your connection");
    } finally {
      setAiLoading(false);
    }
  };

  /* Education */
  const setEduField = (id: string, k: keyof EduEntry, v: string) =>
    edit(p => ({ ...p, education: p.education.map(e => e.id === id ? { ...e, [k]: v } : e) }));
  const deleteEdu = (id: string) => edit(p => ({ ...p, education: p.education.filter(e => e.id !== id) }));
  const addEdu = () => edit(p => ({ ...p, education: [...p.education, { id: uid(), school: "", degree: "", period: "", gpa: "" }] }));

  /* Skills */
  const deleteSkill = (groupId: string, item: string) =>
    edit(p => ({ ...p, skills: p.skills.map(g => g.id === groupId ? { ...g, items: g.items.filter(i => i !== item) } : g) }));
  const addSkillItem = (groupId: string) => {
    const val = (newSkill[groupId] || "").trim();
    if (!val) return;
    edit(p => ({ ...p, skills: p.skills.map(g => g.id === groupId ? { ...g, items: [...g.items, val] } : g) }));
    setNewSkill(p => ({ ...p, [groupId]: "" }));
    setAddingSkillFor(null);
    toast.success(`"${val}" added`);
  };
  const deleteSkillGroup = (id: string) => edit(p => ({ ...p, skills: p.skills.filter(g => g.id !== id) }));
  const addSkillGroup = () => edit(p => ({ ...p, skills: [...p.skills, { id: uid(), category: "New Category", items: [] }] }));

  /* Projects */
  const setProjField = (id: string, k: keyof Project, v: string) =>
    edit(p => ({ ...p, projects: p.projects.map(pr => pr.id === id ? { ...pr, [k]: v } : pr) }));
  const deleteProj = (id: string) => edit(p => ({ ...p, projects: p.projects.filter(pr => pr.id !== id) }));
  const addProj = () => edit(p => ({ ...p, projects: [...p.projects, { id: uid(), name: "", desc: "", link: "", tags: "" }] }));

  /* AI & export */
  const aiEnhance = async (expId: string, bulletId: string) => {
    const exp = data.experience.find(e => e.id === expId);
    if (!exp) return;
    const bullet = exp.bullets.find(b => b.id === bulletId)?.text ?? exp.bullets[0]?.text ?? "";
    setSugg(null);
    setAiLoading(true);
    const toastId = toast.loading("Generating AI suggestion…");
    try {
      const res = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bullet,
          mode,
          role: exp.role,
          company: exp.company,
          allBullets: exp.bullets.map(b => b.text),
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setSugg({ entryId: expId, bulletId, text: json.text });
      toast.dismiss(toastId);
      toast.success("AI suggestion ready ✨");
    } catch {
      toast.dismiss(toastId);
      toast.error("AI request failed — check your connection");
    } finally {
      setAiLoading(false);
    }
  };

  const detectGithubSkills = () => {
    const detected = ["TypeScript", "Go", "GraphQL"];
    edit(p => {
      const fe = p.skills.find(g => g.category === "Frontend");
      if (!fe) return p;
      const toAdd = detected.filter(s => !fe.items.includes(s));
      if (!toAdd.length) { toast("No new skills detected"); return p; }
      return { ...p, skills: p.skills.map(g => g.id === fe.id ? { ...g, items: [...g.items, ...toAdd] } : g) };
    });
    toast.success("GitHub skills imported!");
  };

  const [jobDetails, setJobDetails] = useState<{
    matched_keywords: string[];
    missing_keywords: string[];
    strengths: string[];
    gaps: string[];
  } | null>(null);

  const analyzeJobMatch = async () => {
    if (!jobDesc.trim()) { toast.error("Paste a job description first"); return; }
    setAiLoading(true);
    const id = toast.loading("Analyzing job match with AI…");
    try {
      const res = await fetch("/api/ai/job-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDesc, resume: data }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setJobScore(json.score);
      setJobDetails({
        matched_keywords: json.matched_keywords || [],
        missing_keywords: json.missing_keywords || [],
        strengths: json.strengths || [],
        gaps: json.gaps || [],
      });
      toast.dismiss(id);
      toast.success(`Match score: ${json.score}%`);
    } catch {
      toast.dismiss(id);
      toast.error("Could not analyze job match");
    } finally {
      setAiLoading(false);
    }
  };

  const importResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected later
    e.target.value = "";

    setImporting(true);
    const toastId = toast.loading("Parsing your resume…");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/ai/parse-resume", { method: "POST", body: form });
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      const p = json.data;
      const addId = () => Math.random().toString(36).slice(2, 9);

      userEdited.current = true;
      setData({
        name:     p.name     || "",
        title:    p.title    || "",
        email:    p.email    || "",
        phone:    p.phone    || "",
        location: p.location || "",
        website:  p.website  || "",
        linkedin: p.linkedin || "",
        github:   p.github   || "",
        summary:  p.summary  || "",
        experience: (p.experience ?? []).map((e: { company?: string; role?: string; period?: string; bullets?: string[] }) => ({
          id: addId(),
          company: e.company || "",
          role:    e.role    || "",
          period:  e.period  || "",
          bullets: (e.bullets ?? [""]).map((b: string) => ({ id: addId(), text: b })),
        })),
        education: (p.education ?? []).map((e: { school?: string; degree?: string; period?: string; gpa?: string }) => ({
          id:     addId(),
          school: e.school || "",
          degree: e.degree || "",
          period: e.period || "",
          gpa:    e.gpa    || "",
        })),
        skills: (p.skills ?? []).map((g: { category?: string; items?: string[] }) => ({
          id:       addId(),
          category: g.category || "Other",
          items:    g.items    ?? [],
        })),
        projects: (p.projects ?? []).map((pr: { name?: string; desc?: string; link?: string; tags?: string }) => ({
          id:   addId(),
          name: pr.name || "",
          desc: pr.desc || "",
          link: pr.link || "",
          tags: pr.tags || "",
        })),
      });

      toast.dismiss(toastId);
      toast.success("Resume imported!", {
        description: `${p.experience?.length ?? 0} jobs · ${p.skills?.length ?? 0} skill groups · ${p.projects?.length ?? 0} projects`,
      });
      setSection("basics");
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err instanceof Error ? err.message : "Import failed — try again");
    } finally {
      setImporting(false);
    }
  };

  const exportPDF = () => {
    toast("Opening print dialog…");
    setTimeout(() => window.print(), 300);
  };

  const shareLink = async () => {
    const url = `${window.location.origin}/editor/resume`;
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  /* Current mode style */
  const modeStyle = MODES.find(m => m.id === mode)?.cls || MODES[0].cls;

  return (
    <div className="flex h-screen overflow-hidden bg-[#050508]">
      <DashboardSidebar />

      {/* Print-only resume — uses selected template */}
      <div className="print-resume hidden" ref={printRef}>
        <ResumeDoc data={data} tmpl={RESUME_TEMPLATES.find(t => t.id === templateId) ?? RESUME_TEMPLATES[0]} />
      </div>

      {/* Main editor */}
      <div className="flex-1 ml-[220px] flex flex-col h-screen no-print">

        {/* Toolbar */}
        <div className="h-14 border-b border-white/[0.05] flex items-center gap-3 px-4 bg-[#050508]/80 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-white/35 hover:text-white/60 transition-colors mr-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <div className="w-px h-4 bg-white/[0.06]" />
          <input
            value={data.name ? `${data.name} — ${data.title}` : "Untitled Resume"}
            readOnly
            className="bg-transparent border-none text-sm font-semibold text-white/80 w-56 cursor-default"
          />
          {/* Hidden file input for resume import */}
          <input
            ref={importRef}
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            className="hidden"
            onChange={importResume}
          />

          <div className="ml-auto flex items-center gap-2">
            {/* Mode pills */}
            <div className="hidden md:flex items-center gap-1 bg-white/[0.02] rounded-lg p-1">
              {MODES.slice(0, 3).map(m => (
                <button key={m.id} onClick={() => setMode(m.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${mode === m.id ? m.cls : "text-white/35 hover:text-white/45"}`}>
                  {m.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowTemplatePicker(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/[0.05] border border-white/[0.08] text-white/45 hover:bg-white/[0.06] transition-all"
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              {RESUME_TEMPLATES.find(t => t.id === templateId)?.label ?? "Template"}
            </button>
            <button
              onClick={() => importRef.current?.click()}
              disabled={importing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/[0.05] border border-white/[0.08] text-white/45 hover:bg-white/[0.06] transition-all disabled:opacity-50 disabled:cursor-wait"
            >
              {importing
                ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }} className="block w-3.5 h-3.5 border-2 border-white/20 border-t-white/60 rounded-full" />
                : <Upload className="w-3.5 h-3.5" />}
              Import
            </button>
            <button onClick={() => setPreview(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/[0.05] border border-white/[0.08] text-white/45 hover:bg-white/[0.05] transition-all">
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
            <button onClick={shareLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/[0.05] border border-white/[0.08] text-white/45 hover:bg-white/[0.05] transition-all">
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
            <button onClick={save}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${saved ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-white/[0.05] border-white/[0.08] text-white/45 hover:bg-white/[0.05]"}`}>
              {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {saved ? "Saved" : "Save"}
            </button>
            <button onClick={exportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-[#060608] hover:bg-white/90 transition-colors">
              <Download className="w-3.5 h-3.5" /> Export PDF
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Section nav */}
          <div className="w-44 border-r border-white/[0.05] bg-white/[0.025] flex-shrink-0 overflow-y-auto">
            <div className="p-3">
              <div className="text-[10px] text-white/35 uppercase tracking-wider font-medium mb-3 px-2">Sections</div>
              {SECTION_LABELS.map(s => (
                <button key={s.id} onClick={() => setSection(s.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all mb-0.5 ${section === s.id ? "bg-white/[0.07] text-white border border-white/[0.1]" : "text-white/45 hover:bg-white/[0.05] hover:text-white/80"}`}>
                  <s.icon className="w-3.5 h-3.5 flex-shrink-0" />{s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Editor content */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">

              {/* ── BASICS ── */}
              {section === "basics" && (
                <motion.div key="basics" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} className="max-w-2xl">
                  <h2 className="text-base font-semibold mb-5">Personal Information</h2>
                  <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-6 grid grid-cols-2 gap-4">
                    {([
                      ["name", "Full Name", "John Doe"],
                      ["title", "Job Title", "Software Engineer"],
                      ["email", "Email", "john@example.com"],
                      ["phone", "Phone", "+1 (555) 000-0000"],
                      ["location", "Location", "San Francisco, CA"],
                      ["website", "Website", "johndev.io"],
                      ["linkedin", "LinkedIn", "linkedin.com/in/johndoe"],
                      ["github", "GitHub", "github.com/johndoe"],
                    ] as [keyof ResumeData, string, string][]).map(([k, label, ph]) => (
                      <div key={k}>
                        <label className="text-xs text-white/35 mb-1.5 block">{label}</label>
                        <input value={data[k] as string} onChange={e => setField(k, e.target.value)} placeholder={ph}
                          className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white/80 placeholder:text-white/25 focus:border-white/[0.15] transition-colors" />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── SUMMARY ── */}
              {section === "summary" && (
                <motion.div key="summary" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} className="max-w-2xl">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-semibold">Professional Summary</h2>
                    <button
                      disabled={aiLoading}
                      onClick={async () => {
                        setSummarySugg(null);
                        setAiLoading(true);
                        const id = toast.loading("Generating AI suggestion…");
                        try {
                          const res = await fetch("/api/ai/summary", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              current: data.summary,
                              mode,
                              role: data.title,
                              title: data.title,
                              experience: data.experience,
                            }),
                          });
                          const json = await res.json();
                          if (json.error) throw new Error(json.error);
                          setSummarySugg(json.text);
                          toast.dismiss(id);
                          toast.success("AI suggestion ready ✨");
                        } catch {
                          toast.dismiss(id);
                          toast.error("AI request failed");
                        } finally {
                          setAiLoading(false);
                        }
                      }}
                      className="flex items-center gap-1.5 text-xs text-white/55 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.08] transition-all disabled:opacity-50 disabled:cursor-wait">
                      <Sparkles className="w-3.5 h-3.5" /> {aiLoading ? "Generating…" : "AI Suggest"}
                    </button>
                  </div>
                  <p className="text-xs text-white/35 mb-3 leading-relaxed">
                    The more detail you add here — your years of experience, key technologies, and what kind of roles you're targeting — the better the AI can tailor rewrites and recruiter feedback to your actual profile.
                  </p>
                  <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-5">
                    <textarea value={data.summary} onChange={e => setField("summary", e.target.value)}
                      placeholder="Write a 2–3 sentence summary of your experience, skills, and what you're looking for..."
                      className="w-full bg-transparent border-none text-sm text-white/80 leading-relaxed resize-none focus:outline-none min-h-[120px]"
                      rows={5} />
                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.05] mt-2">
                      <span className="text-xs text-white/35">{data.summary.length} characters</span>
                      <span className={`text-xs ${data.summary.length > 50 && data.summary.length < 600 ? "text-emerald-400" : "text-amber-400"}`}>
                        {data.summary.length < 50 ? "Too short" : data.summary.length > 600 ? "Too long" : "Good length"}
                      </span>
                    </div>
                  </div>

                  {/* AI suggestion card */}
                  <AnimatePresence>
                    {summarySugg && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        className="mt-3 rounded-2xl bg-white/[0.03] border border-white/[0.1] p-4"
                      >
                        <div className="flex items-center gap-2 mb-2.5">
                          <Sparkles className="w-3.5 h-3.5 text-white/50" />
                          <span className="text-[11px] font-semibold text-white/55 uppercase tracking-wider">AI Suggestion</span>
                        </div>
                        <p className="text-sm text-white/75 leading-relaxed mb-4">{summarySugg}</p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setField("summary", summarySugg); setSummarySugg(null); toast.success("Summary updated!"); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-[#060608] hover:bg-white/90 transition-colors"
                          >
                            <Check className="w-3 h-3" /> Use this
                          </button>
                          <button
                            onClick={() => setSummarySugg(null)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/60 border border-white/[0.08] transition-colors"
                          >
                            <X className="w-3 h-3" /> Dismiss
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* ── EXPERIENCE ── */}
              {section === "experience" && (
                <motion.div key="experience" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} className="max-w-2xl">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-semibold">Work Experience</h2>
                    <button onClick={addExp} className="flex items-center gap-1.5 text-xs text-white/55 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.08] transition-all">
                      <Plus className="w-3.5 h-3.5" /> Add position
                    </button>
                  </div>
                  <div className="space-y-4">
                    {data.experience.map((exp) => (
                      <div key={exp.id} className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-5 group">
                        {/* Header row */}
                        <div className="flex items-start gap-3 mb-4">
                          <GripVertical className="w-4 h-4 text-white/25 mt-1 opacity-0 group-hover:opacity-40 flex-shrink-0" />
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] text-white/35 mb-1 block">Role</label>
                              <input value={exp.role} onChange={e => setExpField(exp.id, "role", e.target.value)}
                                className="w-full bg-transparent border-b border-white/[0.06] text-sm font-semibold text-white/90 focus:outline-none focus:border-white/[0.15] pb-1" />
                            </div>
                            <div>
                              <label className="text-[10px] text-white/35 mb-1 block">Company</label>
                              <input value={exp.company} onChange={e => setExpField(exp.id, "company", e.target.value)}
                                className="w-full bg-transparent border-b border-white/[0.06] text-sm text-white/55 focus:outline-none focus:border-white/[0.15] pb-1" />
                            </div>
                            <div className="col-span-2">
                              <label className="text-[10px] text-white/35 mb-1 block">Period</label>
                              <input value={exp.period} onChange={e => setExpField(exp.id, "period", e.target.value)}
                                className="w-full bg-transparent border-b border-white/[0.06] text-xs text-white/35 focus:outline-none focus:border-white/[0.15] pb-1" />
                            </div>
                          </div>
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { if (data.experience.length > 1) deleteExp(exp.id); else toast.error("Need at least one entry"); }}
                              className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Bullets */}
                        <div className="space-y-1.5 pl-7">
                          {exp.bullets.map((b) => {
                            const isTargeted = suggestion?.entryId === exp.id && suggestion?.bulletId === b.id;
                            return (
                              <div key={b.id}>
                                <div className={`flex items-start gap-2 group/b rounded-lg transition-colors ${isTargeted ? "bg-white/[0.03]" : ""}`}>
                                  <div className="w-1.5 h-1.5 rounded-full bg-white/30 mt-2.5 flex-shrink-0" />
                                  <textarea value={b.text} onChange={e => setBullet(exp.id, b.id, e.target.value)}
                                    className="flex-1 bg-transparent border-none text-sm text-white/60 leading-relaxed resize-none focus:outline-none px-2 py-1 rounded-lg transition-colors min-h-[24px]"
                                    rows={2} placeholder="Describe your achievement with impact…" />
                                  <div className="flex items-center gap-1 opacity-0 group-hover/b:opacity-100 transition-opacity flex-shrink-0 mt-1">
                                    <button
                                      onClick={() => aiEnhance(exp.id, b.id)}
                                      disabled={aiLoading}
                                      title="AI suggest improvement for this bullet"
                                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] bg-white/[0.04] border border-white/[0.08] text-white/45 hover:bg-white/[0.08] hover:text-white/70 transition-all disabled:opacity-30 disabled:cursor-wait">
                                      <Sparkles className="w-2.5 h-2.5" />
                                      {aiLoading && isTargeted ? "…" : "AI"}
                                    </button>
                                    <button onClick={() => exp.bullets.length > 1 ? deleteBullet(exp.id, b.id) : toast.error("Need at least one bullet")}
                                      className="text-red-400/50 hover:text-red-400 transition-colors">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Per-bullet suggestion card */}
                                <AnimatePresence>
                                  {isTargeted && (
                                    <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                                      className="ml-5 mt-1.5 mb-1 rounded-xl bg-white/[0.04] border border-white/[0.09] p-3.5 overflow-hidden">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-1.5 text-[10px] text-white/45">
                                          <Sparkles className="w-3 h-3" />
                                          AI suggestion — <span className={`px-1.5 py-0.5 rounded border ${modeStyle}`}>{MODES.find(m=>m.id===mode)?.label}</span>
                                        </div>
                                        <button onClick={() => setSugg(null)} className="text-white/25 hover:text-white/45"><X className="w-3.5 h-3.5" /></button>
                                      </div>
                                      <p className="text-sm text-white/70 leading-relaxed mb-3">{suggestion!.text}</p>
                                      <div className="flex gap-2">
                                        <button onClick={acceptSuggestion}
                                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[#060608] text-xs font-medium hover:bg-white/90 transition-all">
                                          <Check className="w-3 h-3" /> Use this
                                        </button>
                                        <button onClick={() => aiEnhance(exp.id, b.id)}
                                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] text-white/45 text-xs hover:bg-white/[0.06] transition-all">
                                          <RotateCcw className="w-3 h-3" /> Try another
                                        </button>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                          <button onClick={() => addBullet(exp.id)}
                            className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/45 px-2 py-1 rounded-lg hover:bg-white/[0.02] transition-all mt-1">
                            <Plus className="w-3 h-3" /> Add bullet
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── EDUCATION ── */}
              {section === "education" && (
                <motion.div key="education" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} className="max-w-2xl">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-semibold">Education</h2>
                    <button onClick={addEdu} className="flex items-center gap-1.5 text-xs text-white/55 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.08] transition-all">
                      <Plus className="w-3.5 h-3.5" /> Add entry
                    </button>
                  </div>
                  <div className="space-y-4">
                    {data.education.map(edu => (
                      <div key={edu.id} className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-5 group">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 grid grid-cols-2 gap-3 mr-3">
                            <div className="col-span-2">
                              <label className="text-[10px] text-white/35 mb-1 block">School / University</label>
                              <input value={edu.school} onChange={e => setEduField(edu.id, "school", e.target.value)}
                                className="w-full bg-transparent border-b border-white/[0.06] text-sm font-semibold text-white/90 focus:outline-none focus:border-white/[0.15] pb-1" />
                            </div>
                            <div>
                              <label className="text-[10px] text-white/35 mb-1 block">Degree / Major</label>
                              <input value={edu.degree} onChange={e => setEduField(edu.id, "degree", e.target.value)}
                                className="w-full bg-transparent border-b border-white/[0.06] text-sm text-white/45 focus:outline-none focus:border-white/[0.15] pb-1" />
                            </div>
                            <div>
                              <label className="text-[10px] text-white/35 mb-1 block">Period</label>
                              <input value={edu.period} onChange={e => setEduField(edu.id, "period", e.target.value)}
                                className="w-full bg-transparent border-b border-white/[0.06] text-xs text-white/35 focus:outline-none focus:border-white/[0.15] pb-1" />
                            </div>
                            <div>
                              <label className="text-[10px] text-white/35 mb-1 block">GPA (optional)</label>
                              <input value={edu.gpa} onChange={e => setEduField(edu.id, "gpa", e.target.value)}
                                placeholder="3.8"
                                className="w-full bg-transparent border-b border-white/[0.06] text-xs text-white/35 focus:outline-none focus:border-white/[0.15] pb-1" />
                            </div>
                          </div>
                          <button onClick={() => deleteEdu(edu.id)}
                            className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── SKILLS ── */}
              {section === "skills" && (
                <motion.div key="skills" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} className="max-w-2xl">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-semibold">Skills</h2>
                    <div className="flex gap-2">
                      <button onClick={detectGithubSkills}
                        className="flex items-center gap-1.5 text-xs text-emerald-400 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">
                        <Sparkles className="w-3.5 h-3.5" /> Import from GitHub
                      </button>
                      <button onClick={addSkillGroup}
                        className="flex items-center gap-1.5 text-xs text-white/55 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.08] transition-all">
                        <Plus className="w-3.5 h-3.5" /> Add category
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {data.skills.map(group => (
                      <div key={group.id} className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-5 group">
                        <div className="flex items-center justify-between mb-3">
                          <input value={group.category}
                            onChange={e => edit(p => ({ ...p, skills: p.skills.map(g => g.id === group.id ? { ...g, category: e.target.value } : g) }))}
                            className="bg-transparent border-none text-xs font-medium text-white/45 uppercase tracking-wider focus:outline-none focus:text-white/80" />
                          <button onClick={() => data.skills.length > 1 ? deleteSkillGroup(group.id) : toast.error("Need at least one group")}
                            className="opacity-0 group-hover:opacity-60 hover:opacity-100 text-red-400 transition-opacity">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {group.items.map(item => (
                            <span key={item} className="group/tag flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.05] text-xs text-white/60 hover:border-white/[0.1] transition-all">
                              {item}
                              <button onClick={() => deleteSkill(group.id, item)} className="text-white/25 hover:text-red-400 transition-colors">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                          {addingSkillFor === group.id ? (
                            <div className="flex items-center gap-1.5">
                              <input autoFocus value={newSkill[group.id] || ""} onChange={e => setNewSkill(p => ({ ...p, [group.id]: e.target.value }))}
                                onKeyDown={e => { if (e.key === "Enter") addSkillItem(group.id); if (e.key === "Escape") setAddingSkillFor(null); }}
                                placeholder="Skill name…" className="px-2.5 py-1.5 rounded-lg bg-white/[0.025] border border-white/[0.15] text-xs text-white/80 placeholder:text-white/25 w-28 focus:outline-none" />
                              <button onClick={() => addSkillItem(group.id)} className="text-white/55 hover:text-white/80"><Check className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setAddingSkillFor(null)} className="text-white/35 hover:text-white/60"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          ) : (
                            <button onClick={() => setAddingSkillFor(group.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-white/[0.1] text-xs text-white/35 hover:text-white/45 hover:border-white/20 transition-all">
                              <Plus className="w-3 h-3" /> Add
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── PROJECTS ── */}
              {section === "projects" && (
                <motion.div key="projects" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} className="max-w-2xl">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-semibold">Projects</h2>
                    <button onClick={addProj} className="flex items-center gap-1.5 text-xs text-white/55 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.08] transition-all">
                      <Plus className="w-3.5 h-3.5" /> Add project
                    </button>
                  </div>
                  <div className="space-y-4">
                    {data.projects.map(proj => (
                      <div key={proj.id} className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-5 group">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 space-y-3">
                            <div>
                              <label className="text-[10px] text-white/35 mb-1 block">Project Name</label>
                              <input value={proj.name} onChange={e => setProjField(proj.id, "name", e.target.value)}
                                className="w-full bg-transparent border-b border-white/[0.06] text-sm font-semibold text-white/90 focus:outline-none focus:border-white/[0.15] pb-1" />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[10px] text-white/35">Description</label>
                                <button
                                  onClick={() => aiSuggestProject(proj.id)}
                                  disabled={aiLoading}
                                  title="AI suggest improvement for this description"
                                  className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-white/[0.04] border border-white/[0.08] text-white/40 hover:bg-white/[0.08] hover:text-white/65 transition-all disabled:opacity-30 disabled:cursor-wait">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  {aiLoading && projSugg?.projId === proj.id ? "…" : "AI"}
                                </button>
                              </div>
                              <textarea value={proj.desc} onChange={e => setProjField(proj.id, "desc", e.target.value)} rows={2}
                                className="w-full bg-transparent border-none text-sm text-white/60 leading-relaxed resize-none focus:outline-none" />
                              <AnimatePresence>
                                {projSugg?.projId === proj.id && (
                                  <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                                    className="mt-2 rounded-xl bg-white/[0.04] border border-white/[0.09] p-3.5 overflow-hidden">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-1.5 text-[10px] text-white/45">
                                        <Sparkles className="w-3 h-3" />
                                        AI suggestion — <span className={`px-1.5 py-0.5 rounded border ${modeStyle}`}>{MODES.find(m=>m.id===mode)?.label}</span>
                                      </div>
                                      <button onClick={() => setProjSugg(null)} className="text-white/25 hover:text-white/45"><X className="w-3.5 h-3.5" /></button>
                                    </div>
                                    <p className="text-sm text-white/70 leading-relaxed mb-3">{projSugg.text}</p>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => { setProjField(proj.id, "desc", projSugg.text); setProjSugg(null); toast.success("Description updated!"); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[#060608] text-xs font-medium hover:bg-white/90 transition-all">
                                        <Check className="w-3 h-3" /> Use this
                                      </button>
                                      <button
                                        onClick={() => aiSuggestProject(proj.id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] text-white/45 text-xs hover:bg-white/[0.06] transition-all">
                                        <RotateCcw className="w-3 h-3" /> Try another
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] text-white/35 mb-1 block">Link / GitHub</label>
                                <input value={proj.link} onChange={e => setProjField(proj.id, "link", e.target.value)}
                                  placeholder="github.com/you/project"
                                  className="w-full bg-transparent border-b border-white/[0.06] text-xs text-white/40 focus:outline-none focus:border-white/[0.15] pb-1" />
                              </div>
                              <div>
                                <label className="text-[10px] text-white/35 mb-1 block">Tech stack (comma separated)</label>
                                <input value={proj.tags} onChange={e => setProjField(proj.id, "tags", e.target.value)}
                                  placeholder="React, TypeScript, AWS"
                                  className="w-full bg-transparent border-b border-white/[0.06] text-xs text-white/35 focus:outline-none focus:border-white/[0.15] pb-1" />
                              </div>
                            </div>
                          </div>
                          <button onClick={() => deleteProj(proj.id)}
                            className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* AI panel */}
          {aiOpen ? (
            <div className="w-[272px] border-l border-white/[0.05] bg-white/[0.03] flex-shrink-0 overflow-y-auto">
              <div className="p-4 space-y-5">
                {/* Score */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-white/45 uppercase tracking-wider">Resume Score</span>
                    <button onClick={() => setAiOpen(false)} className="text-white/25 hover:text-white/45"><X className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4">
                    <div className="flex justify-center mb-4"><ScoreRing score={score.total} /></div>
                    {([
                      ["Keywords",  score.keywords,   "bg-white/40"],
                      ["Impact",    score.impact,     "bg-white/35"],
                      ["Clarity",   score.clarity,    "bg-pink-500"],
                      ["Formatting",score.formatting, "bg-emerald-500"],
                    ] as [string, number, string][]).map(([l, v, c]) => (
                      <div key={l} className="mb-2">
                        <div className="flex justify-between text-[10px] text-white/35 mb-1"><span>{l}</span><span>{v}%</span></div>
                        <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                          <motion.div className={`h-full rounded-full ${c}`} initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI tools */}
                <div>
                  <div className="text-xs font-semibold text-white/45 uppercase tracking-wider mb-3">AI Actions</div>
                  <div className="space-y-1">
                    {[
                      { label: "Rewrite selected",    icon: Wand2,     action: async () => { const exp = data.experience[0]; if (!exp || !exp.bullets[0]) return; await aiEnhance(exp.id, exp.bullets[0].id); setSection("experience"); } },
                      { label: "Improve impact",       icon: Zap,       action: async () => {
                        setAiLoading(true); setSection("summary");
                        const id = toast.loading("Improving impact…");
                        try {
                          const res = await fetch("/api/ai/summary", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ current: data.summary, mode: "professional", role: data.title, title: data.title, experience: data.experience }) });
                          const json = await res.json();
                          if (!json.error) { setField("summary", json.text); toast.dismiss(id); toast.success("Summary improved!"); }
                          else throw new Error(json.error);
                        } catch { toast.dismiss(id); toast.error("AI request failed"); } finally { setAiLoading(false); }
                      }},
                      { label: "Add metrics",          icon: Target,    action: () => { const exp = data.experience[0]; if (!exp || !exp.bullets[0]) return; aiEnhance(exp.id, exp.bullets[0].id); setSection("experience"); } },
                      { label: "ATS optimize",         icon: Check,     action: async () => {
                        setAiLoading(true); setSection("summary");
                        const id = toast.loading("ATS optimizing summary…");
                        try {
                          const res = await fetch("/api/ai/summary", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ current: data.summary, mode: "corporate", role: data.title, title: data.title, experience: data.experience }) });
                          const json = await res.json();
                          if (!json.error) { setField("summary", json.text); toast.dismiss(id); toast.success("ATS keywords added!"); }
                          else throw new Error(json.error);
                        } catch { toast.dismiss(id); toast.error("AI request failed"); } finally { setAiLoading(false); }
                      }},
                      { label: "Shorten summary",      icon: RotateCcw, action: () => { const s = data.summary; setField("summary", s.split(".").slice(0,2).join(".")+"."); setSection("summary"); toast.success("Summary shortened!"); } },
                    ].map(tool => (
                      <button key={tool.label} onClick={tool.action} disabled={aiLoading}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-white/45 hover:text-white/80 hover:bg-white/[0.05] transition-all group disabled:opacity-40 disabled:cursor-wait">
                        <tool.icon className="w-3.5 h-3.5 text-white/40 group-hover:text-white/70" />
                        {tool.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode */}
                <div>
                  <div className="text-xs font-semibold text-white/45 uppercase tracking-wider mb-2">Rewrite mode</div>
                  <div className="space-y-1">
                    {MODES.map(m => (
                      <button key={m.id} onClick={() => setMode(m.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition-all ${mode === m.id ? m.cls : "text-white/35 border-transparent hover:bg-white/[0.02]"}`}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Job match */}
                <div>
                  <div className="text-xs font-semibold text-white/45 uppercase tracking-wider mb-3">Job Match</div>
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3">
                    <textarea value={jobDesc} onChange={e => setJobDesc(e.target.value)}
                      placeholder="Paste job description to check keyword match…"
                      className="w-full bg-transparent border-none text-xs text-white/45 placeholder:text-white/25 resize-none leading-relaxed focus:outline-none"
                      rows={4} />
                    {jobScore !== null && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2 text-xs">
                          <span className={`font-bold text-sm ${jobScore >= 80 ? "text-emerald-400" : "text-amber-400"}`}>{jobScore}%</span>
                          <span className="text-white/35">keyword match</span>
                        </div>
                        {jobDetails && (
                          <div className="space-y-2 text-[10px]">
                            {jobDetails.matched_keywords.length > 0 && (
                              <div>
                                <div className="text-emerald-400/60 mb-1">✓ Matched</div>
                                <div className="flex flex-wrap gap-1">
                                  {jobDetails.matched_keywords.map(k => <span key={k} className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">{k}</span>)}
                                </div>
                              </div>
                            )}
                            {jobDetails.missing_keywords.length > 0 && (
                              <div>
                                <div className="text-red-400/60 mb-1">✗ Missing</div>
                                <div className="flex flex-wrap gap-1">
                                  {jobDetails.missing_keywords.map(k => <span key={k} className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/20">{k}</span>)}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    <button onClick={analyzeJobMatch} disabled={aiLoading}
                      className="mt-1 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white text-[#060608] text-xs font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-wait">
                      <Target className="w-3.5 h-3.5" /> {aiLoading ? "Analyzing…" : "Analyze match"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button onClick={() => setAiOpen(true)} className="w-10 border-l border-white/[0.05] bg-white/[0.025] flex items-center justify-center text-white/25 hover:text-white/45 hover:bg-white/[0.02] transition-all flex-shrink-0">
              <span className="rotate-90 text-[10px] whitespace-nowrap text-white/35 font-medium tracking-wider">AI TOOLS</span>
            </button>
          )}
        </div>
      </div>

      {/* Template picker modal */}
      <AnimatePresence>
        {showTemplatePicker && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-8 no-print"
            onClick={() => setShowTemplatePicker(false)}>
            <motion.div initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.95, opacity:0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-3xl bg-[#0e0e14] rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <div>
                  <h2 className="text-sm font-semibold text-white/90">Resume Template</h2>
                  <p className="text-[11px] text-white/35 mt-0.5">Choose a style for your resume. Applies to preview and PDF export.</p>
                </div>
                <button onClick={() => setShowTemplatePicker(false)} className="text-white/30 hover:text-white/55"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 grid grid-cols-3 gap-4">
                {RESUME_TEMPLATES.map(tmpl => (
                  <button key={tmpl.id} onClick={() => { setTemplateId(tmpl.id); setShowTemplatePicker(false); }}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all text-left group ${templateId === tmpl.id ? "border-white/60 shadow-lg shadow-white/5" : "border-white/[0.07] hover:border-white/25"}`}>
                    {/* Mini thumbnail */}
                    <div style={{ background: tmpl.bg, padding: "10px 12px 8px", minHeight: 110 }}>
                      {tmpl.headerBg ? (
                        <div style={{ background: tmpl.headerBg, margin: "-10px -12px 8px", padding: "8px 12px" }}>
                          <div style={{ height: 5, width: "55%", background: tmpl.headerText ?? "#fff", opacity: 0.8, borderRadius: 2, marginBottom: 3 }} />
                          <div style={{ height: 3, width: "35%", background: tmpl.headerText ?? "#fff", opacity: 0.4, borderRadius: 2 }} />
                        </div>
                      ) : (
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ height: 5, width: "55%", background: tmpl.bodyText, opacity: 0.7, borderRadius: 2, marginBottom: 3 }} />
                          <div style={{ height: 3, width: "35%", background: tmpl.mutedText, opacity: 0.5, borderRadius: 2 }} />
                        </div>
                      )}
                      <div style={{ borderBottom: `1px solid ${tmpl.divider}`, marginBottom: 5, paddingBottom: 2 }}>
                        <div style={{ height: 2, width: "30%", background: tmpl.sectionLabel, opacity: 0.7, borderRadius: 1 }} />
                      </div>
                      {[70, 55, 45].map((w, i) => <div key={i} style={{ height: 2, width: `${w}%`, background: tmpl.mutedText, opacity: 0.3, borderRadius: 1, marginBottom: 3 }} />)}
                      <div style={{ borderBottom: `1px solid ${tmpl.divider}`, marginBottom: 5, marginTop: 6, paddingBottom: 2 }}>
                        <div style={{ height: 2, width: "22%", background: tmpl.sectionLabel, opacity: 0.7, borderRadius: 1 }} />
                      </div>
                      <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                        {[28, 22, 30, 18].map((w, i) => <div key={i} style={{ height: 8, width: w, background: tmpl.tagBg, border: `1px solid ${tmpl.tagText}22`, borderRadius: 3 }} />)}
                      </div>
                    </div>
                    {/* Label */}
                    <div className={`px-3 py-2 border-t ${templateId === tmpl.id ? "bg-white/[0.08] border-white/[0.12]" : "bg-[#0e0e14] border-white/[0.05]"}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/80">{tmpl.label}</span>
                        {templateId === tmpl.id && <Check className="w-3 h-3 text-white/60" />}
                      </div>
                      <span className="text-[10px] text-white/30">{tmpl.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview modal */}
      <AnimatePresence>
        {preview && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-8 no-print"
            onClick={() => setPreview(false)}>
            <motion.div initial={{ scale:0.93, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.93, opacity:0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
              style={{ background: RESUME_TEMPLATES.find(t => t.id === templateId)?.bg ?? "#fff" }}>
              <div className="flex items-center justify-between px-5 py-3 border-b border-black/[0.07] flex-shrink-0"
                style={{ background: RESUME_TEMPLATES.find(t => t.id === templateId)?.headerBg ?? "rgba(0,0,0,0.03)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: RESUME_TEMPLATES.find(t => t.id === templateId)?.headerBg ? "#fff" : "#374151" }}>
                    {RESUME_TEMPLATES.find(t => t.id === templateId)?.label} Template
                  </span>
                  <button onClick={() => { setPreview(false); setShowTemplatePicker(true); }}
                    className="text-[10px] px-2 py-0.5 rounded border transition-colors"
                    style={{ color: RESUME_TEMPLATES.find(t => t.id === templateId)?.headerBg ? "rgba(255,255,255,0.55)" : "#9ca3af", borderColor: RESUME_TEMPLATES.find(t => t.id === templateId)?.headerBg ? "rgba(255,255,255,0.2)" : "#e5e7eb" }}>
                    Change
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{ background: RESUME_TEMPLATES.find(t => t.id === templateId)?.bodyText ?? "#111", color: "#fff" }}>
                    <Download className="w-3.5 h-3.5" /> Export PDF
                  </button>
                  <button onClick={() => setPreview(false)}>
                    <X className="w-4 h-4" style={{ color: RESUME_TEMPLATES.find(t => t.id === templateId)?.mutedText ?? "#9ca3af" }} />
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto">
                <ResumeDoc data={data} tmpl={RESUME_TEMPLATES.find(t => t.id === templateId) ?? RESUME_TEMPLATES[0]} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ResumeEditorPage() {
  return (
    <Suspense>
      <ResumeEditorInner />
    </Suspense>
  );
}
