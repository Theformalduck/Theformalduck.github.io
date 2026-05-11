"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Plus,
  FileText,
  Globe,
  MoreHorizontal,
  Eye,
  Download,
  Copy,
  Trash2,
  Sparkles,
  TrendingUp,
  Users,
  Clock,
  ArrowUpRight,
  Zap,
  ChevronRight,
  GitBranch,
  Brain,
  Target,
  AlertCircle,
  Palette,
} from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { computeScore } from "@/lib/scoring";

/* ── Types ── */
interface ResumeData {
  name: string;
  title: string;
  email: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  summary: string;
  experience: { id: string; company: string; role: string; period: string; bullets: { id: string; text: string }[] }[];
  skills: { id: string; category: string; items: string[] }[];
  projects: { id: string; name: string; desc: string; link: string; tags: string }[];
  education: { id: string; school: string; degree: string; period: string; gpa: string }[];
}

interface ResumeEntry {
  id: string;
  label: string;
  data: ResumeData;
  updatedAt: string;
}

type BrandScore = {
  overall: number;
  label: string;
  breakdown: { label: string; score: number; tip: string }[];
  strengths: string[];
  gaps: string[];
};

type AISuggestion = { text: string; type: string; priority: "high" | "medium" | "low" };

const QUICK_ACTIONS = [
  { label: "Edit Resume",    desc: "Add experience & skills",   icon: FileText, href: "/editor/resume"    },
  { label: "Edit Portfolio", desc: "Customize your public site", icon: Globe,    href: "/editor/portfolio" },
  { label: "AI Feedback",    desc: "Expert resume review",       icon: Sparkles, href: "/review"           },
  { label: "Browse Themes",  desc: "Change portfolio style",     icon: Palette,  href: "/themes"           },
];

const scoreResume = (r: ResumeData) =>
  computeScore({ phone: "", location: "", website: "", linkedin: "", github: "", ...r }).total;

/* Derive smart suggestions from resume data */
function deriveAISuggestions(resume: ResumeData): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const allBullets = resume.experience?.flatMap(e => e.bullets.map(b => b.text)) ?? [];

  const vagueCount = allBullets.filter(b =>
    /^(worked on|helped with|responsible for|assisted|participated|involved in)/i.test(b.trim())
  ).length;
  if (vagueCount > 0) {
    suggestions.push({
      text: `${vagueCount} bullet point${vagueCount > 1 ? "s" : ""} use weak phrasing like "worked on" or "responsible for" — replace with strong action verbs and measurable outcomes.`,
      type: "impact",
      priority: "high",
    });
  }

  const allSkills = resume.skills?.flatMap(g => g.items.map(s => s.toLowerCase())) ?? [];
  const cloudKeywords = ["aws", "gcp", "azure", "cloud"];
  const hasCloud = cloudKeywords.some(k => allSkills.includes(k));
  if (!hasCloud) {
    suggestions.push({
      text: "Your resume is missing cloud skills — 68% of engineering roles require AWS, GCP, or Azure. Add any relevant cloud experience.",
      type: "skills",
      priority: "medium",
    });
  }

  const atsKeywords = ["ci/cd", "agile", "cross-functional", "testing", "unit test", "docker"];
  const bulletText = allBullets.join(" ").toLowerCase();
  const summaryText = (resume.summary ?? "").toLowerCase();
  const missing = atsKeywords.filter(k => !bulletText.includes(k) && !summaryText.includes(k) && !allSkills.includes(k));
  if (missing.length >= 3) {
    suggestions.push({
      text: `Missing ATS keywords: "${missing.slice(0, 3).join('", "')}". These appear in most engineering job descriptions.`,
      type: "ats",
      priority: "high",
    });
  }

  if (!resume.summary || resume.summary.length < 80) {
    suggestions.push({
      text: "Your summary is too short — recruiters spend ~6 seconds on first scan. Add your title, years of experience, and top 2 skills.",
      type: "summary",
      priority: "medium",
    });
  }

  const metricsCount = allBullets.filter(b => /\d+[%x+]|\d+\s*(users|clients|hours|ms|K|M)/i.test(b)).length;
  if (metricsCount < 2 && allBullets.length > 2) {
    suggestions.push({
      text: "Less than 2 bullet points contain metrics — add numbers, percentages, or scale to show real impact.",
      type: "metrics",
      priority: "low",
    });
  }

  return suggestions.slice(0, 4);
}

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 85 ? "#10b981" : score >= 70 ? "rgba(255,255,255,0.65)" : "#f59e0b";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

function ResumeCard({
  entry, atsScore, onDelete, onDuplicate,
}: {
  entry: ResumeEntry;
  atsScore: number;
  onDelete: (id: string) => void;
  onDuplicate: (entry: ResumeEntry) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const resume = entry.data ?? { name: "", title: "", skills: [], experience: [], projects: [], education: [], summary: "" };
  const hasCustomData = !!(resume.name && resume.name !== "John Doe");

  useEffect(() => {
    if (!menuOpen) return;
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [menuOpen]);

  const tags = resume.skills?.flatMap(g => g.items).slice(0, 3) ?? [];
  const updatedAgo = (() => {
    const diff = Date.now() - new Date(entry.updatedAt).getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="group rounded-2xl bg-white/[0.025] border border-white/[0.06] p-5 hover:bg-white/[0.02] hover:border-white/[0.1] transition-all relative"
    >
      <div className="flex items-start justify-between mb-4">
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
          hasCustomData
            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
            : "text-white/35 bg-white/[0.05] border-white/[0.1]"
        }`}>
          {hasCustomData ? "● Active" : "○ Default"}
        </span>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-7 h-7 rounded-lg bg-white/0 hover:bg-white/[0.06] flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="w-4 h-4 text-white/45" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 w-44 rounded-xl bg-white/[0.04] border border-white/[0.08] shadow-xl p-1 z-10">
              <button onClick={() => { setMenuOpen(false); window.open(`/editor/resume?id=${entry.id}`, "_blank"); }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-white/45 hover:bg-white/[0.05] hover:text-white/90 transition-all">
                <Eye className="w-3.5 h-3.5" /> Preview
              </button>
              <button onClick={() => { setMenuOpen(false); onDuplicate(entry); }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-white/45 hover:bg-white/[0.05] hover:text-white/90 transition-all">
                <Copy className="w-3.5 h-3.5" /> Duplicate
              </button>
              <button onClick={() => { setMenuOpen(false); onDelete(entry.id); }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-all">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <Link href={`/editor/resume?id=${entry.id}`} className="block mb-4">
        <h3 className="font-semibold text-sm text-white/90 mb-0.5 group-hover:text-white transition-colors">
          {resume.name || entry.label} — {resume.title || "Untitled"}
        </h3>
        <p className="text-[11px] text-white/30 mb-1">{entry.label}</p>
        <p className="text-xs text-white/35">
          <Clock className="w-3 h-3 inline mr-1" />
          Updated {updatedAgo}
        </p>
      </Link>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {tags.length > 0 ? (
          tags.map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.05] text-white/35 border border-white/[0.05]">
              {tag}
            </span>
          ))
        ) : (
          <span className="text-[10px] text-white/25 italic">No skills added yet</span>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
        <div className="flex items-center gap-1 text-xs text-white/35">
          <Eye className="w-3 h-3" />
          {resume.experience?.length ?? 0} exp · {resume.skills?.length ?? 0} skill groups
        </div>
        <ScoreRing score={atsScore} size={44} />
      </div>
    </motion.div>
  );
}

function NewResumeCard({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onCreate}
      className="w-full rounded-2xl border border-dashed border-white/[0.08] p-5 flex flex-col items-center justify-center text-center gap-3 min-h-[140px] hover:border-white/[0.15] hover:bg-white/[0.02] transition-all group"
    >
      <div className="w-8 h-8 rounded-xl bg-white/[0.05] flex items-center justify-center">
        <Plus className="w-4 h-4 text-white/35 group-hover:text-white/45 transition-colors" />
      </div>
      <div>
        <p className="text-xs font-medium text-white/35 group-hover:text-white/45 transition-colors">Create new resume</p>
        <p className="text-[10px] text-white/25 mt-0.5">for a different role or audience</p>
      </div>
    </motion.button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumeEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [brandScore, setBrandScore] = useState<BrandScore | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetch("/api/user/resumes")
      .then(r => r.json())
      .then(json => { if (json.resumes) setResumes(json.resumes); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const primaryResume = resumes[0]?.data ?? null;
  const atsScore = primaryResume ? scoreResume(primaryResume) : 0;
  const aiSuggestions = primaryResume ? deriveAISuggestions(primaryResume) : [];

  const createResume = async () => {
    const tid = toast.loading("Creating new resume…");
    try {
      const res = await fetch("/api/user/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: "New Resume" }),
      });
      const json = await res.json();
      toast.dismiss(tid);
      router.push(`/editor/resume?id=${json.id}`);
    } catch {
      toast.dismiss(tid);
      toast.error("Could not create resume");
    }
  };

  const deleteResume = async (id: string) => {
    const tid = toast.loading("Deleting…");
    try {
      await fetch(`/api/user/resumes/${id}`, { method: "DELETE" });
      setResumes(prev => prev.filter(r => r.id !== id));
      toast.dismiss(tid);
      toast.success("Resume deleted");
    } catch {
      toast.dismiss(tid);
      toast.error("Could not delete resume");
    }
  };

  const duplicateResume = async (entry: ResumeEntry) => {
    const tid = toast.loading("Duplicating…");
    try {
      const res = await fetch("/api/user/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: `${entry.label} (copy)`, data: entry.data }),
      });
      const json = await res.json();
      const newEntry: ResumeEntry = {
        id: json.id,
        label: json.label,
        data: entry.data,
        updatedAt: new Date().toISOString(),
      };
      setResumes(prev => [newEntry, ...prev]);
      toast.dismiss(tid);
      toast.success("Resume duplicated");
    } catch {
      toast.dismiss(tid);
      toast.error("Could not duplicate resume");
    }
  };

  const analyzeBrand = async () => {
    setAnalyzing(true);
    const id = toast.loading("Analyzing your brand…");
    try {
      const portfolioRes = await fetch("/api/user/portfolio").then(r => r.json()).catch(() => ({}));
      const portfolio = portfolioRes.data ?? (() => {
        const stored = localStorage.getItem("folio_portfolio");
        return stored ? (JSON.parse(stored).data ?? {}) : {};
      })();
      const res = await fetch("/api/ai/brand-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolio }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setBrandScore(json);
      toast.dismiss(id);
      toast.success("Brand score updated!");
    } catch {
      toast.dismiss(id);
      toast.error("Could not analyze brand");
    } finally {
      setAnalyzing(false);
    }
  };

  const firstName = primaryResume?.name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const stats = [
    {
      label: "ATS Score",
      value: primaryResume ? String(atsScore) : "—",
      change: primaryResume ? (atsScore >= 80 ? "Strong" : atsScore >= 60 ? "Fair" : "Needs work") : "No resume",
      icon: Target,
      color: "text-emerald-400",
    },
    {
      label: "Resumes",
      value: loaded ? String(resumes.length) : "—",
      change: resumes.length === 1 ? "1 resume" : `${resumes.length} resumes`,
      icon: FileText,
      color: "text-white/55",
    },
    {
      label: "Skills",
      value: primaryResume ? String(primaryResume.skills?.reduce((n, g) => n + g.items.length, 0) ?? 0) : "—",
      change: "listed",
      icon: Zap,
      color: "text-white/55",
    },
    {
      label: "AI Insights",
      value: String(aiSuggestions.length),
      change: aiSuggestions.filter(s => s.priority === "high").length > 0
        ? `${aiSuggestions.filter(s => s.priority === "high").length} high priority`
        : "all clear",
      icon: Users,
      color: "text-pink-600",
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#050508]">
      <DashboardSidebar />

      <main className="flex-1 ml-[220px] min-h-screen">
        {/* Top bar */}
        <div className="h-16 border-b border-white/[0.05] flex items-center justify-between px-8 bg-[#050508]/80 backdrop-blur-xl sticky top-0 z-30">
          <div>
            <h1 className="font-semibold text-base">Dashboard</h1>
            <p className="text-xs text-white/35">{greeting}, {firstName}</p>
          </div>
          <div className="flex items-center gap-3">
            {aiSuggestions.filter(s => s.priority === "high").length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/55 text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{aiSuggestions.filter(s => s.priority === "high").length} high-priority insights</span>
              </div>
            )}
            <button
              onClick={createResume}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-[#060608] text-sm font-medium hover:bg-white/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Resume
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Get started guide for new users */}
          {loaded && resumes.length === 0 && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] p-6">
                <p className="text-base font-semibold mb-1">Get started in 3 steps</p>
                <p className="text-xs text-white/35 mb-5">Folio.ai helps you build a professional resume and a public portfolio site — powered by AI.</p>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { step: "1", title: "Build your resume", desc: "Add your experience, skills, and education. AI will suggest improvements.", href: "/editor/resume", cta: "Open Resume Editor" },
                    { step: "2", title: "Create your portfolio", desc: "Generate a live public website from your resume data with one click.", href: "/editor/portfolio", cta: "Open Portfolio Editor" },
                    { step: "3", title: "Share your link", desc: "Publish and share your portfolio URL with recruiters and employers.", href: "/editor/portfolio", cta: "Publish Portfolio" },
                  ].map(s => (
                    <div key={s.step} className="flex flex-col gap-2 p-4 rounded-xl bg-white/[0.025] border border-white/[0.06]">
                      <div className="w-6 h-6 rounded-full bg-white/[0.07] flex items-center justify-center text-[11px] font-bold text-white/50">{s.step}</div>
                      <p className="text-sm font-medium text-white/80">{s.title}</p>
                      <p className="text-[11px] text-white/35 leading-relaxed flex-1">{s.desc}</p>
                      <Link href={s.href} className="text-[11px] text-white/55 hover:text-white/80 flex items-center gap-1 mt-1 transition-colors">
                        {s.cta} <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-white/35 flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" />
                    {stat.change}
                  </span>
                </div>
                <div className="text-2xl font-bold mb-0.5">{stat.value}</div>
                <div className="text-xs text-white/35">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Quick actions */}
          <div>
            <h2 className="text-sm font-semibold text-white/45 mb-3 uppercase tracking-wider">Quick actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {QUICK_ACTIONS.map((action, i) => (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    href={action.href}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.025] border border-white/[0.06] hover:bg-white/[0.02] hover:border-white/[0.1] transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.09] flex items-center justify-center flex-shrink-0">
                      <action.icon className="w-4 h-4 text-white/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white/70 group-hover:text-white/90 transition-colors leading-tight">{action.label}</div>
                      <div className="text-[10px] text-white/30 leading-tight mt-0.5">{action.desc}</div>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-white/25 ml-auto group-hover:text-white/35 transition-colors flex-shrink-0" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Resumes */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white/45 uppercase tracking-wider">My Resumes</h2>
                <button onClick={createResume} className="text-xs text-white/40 hover:text-white/60 flex items-center gap-1">
                  <Plus className="w-3 h-3" /> New
                </button>
              </div>
              <div className="space-y-3">
                {resumes.map(entry => (
                  <ResumeCard
                    key={entry.id}
                    entry={entry}
                    atsScore={entry.data ? scoreResume(entry.data) : 0}
                    onDelete={deleteResume}
                    onDuplicate={duplicateResume}
                  />
                ))}
                <NewResumeCard onCreate={createResume} />
              </div>
            </div>

            {/* Right panel */}
            <div className="space-y-4">
              {/* AI Suggestions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-white/45 uppercase tracking-wider">AI Insights</h2>
                  {aiSuggestions.length > 0 && (
                    <span className="text-xs text-white/40">{aiSuggestions.length} found</span>
                  )}
                </div>
                {aiSuggestions.length > 0 ? (
                  <div className="space-y-2">
                    {aiSuggestions.map((sug, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.06 }}
                        className="rounded-xl bg-white/[0.025] border border-white/[0.06] p-3.5 group hover:bg-white/[0.02] transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                            sug.priority === "high" ? "bg-red-400" : sug.priority === "medium" ? "bg-amber-400" : "bg-white/40"
                          }`} />
                          <p className="text-xs text-white/45 leading-relaxed group-hover:text-white/80 transition-colors">
                            {sug.text}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    <Link
                      href="/review"
                      className="flex items-center gap-1.5 mt-2 text-xs text-white/40 hover:text-white/60 transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      Full AI review
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                ) : loaded && primaryResume ? (
                  <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-3.5 text-xs text-emerald-300/70 leading-relaxed">
                    No major issues detected. Run a full AI review to get detailed feedback.
                  </div>
                ) : (
                  <div className="rounded-xl bg-white/[0.025] border border-white/[0.06] p-3.5 text-xs text-white/35 italic">
                    Create a resume to see AI-powered insights.
                  </div>
                )}
              </div>

              {/* AI Brand Score */}
              <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-white/50" />
                    <span className="text-sm font-semibold">Brand Score</span>
                  </div>
                  <button
                    onClick={analyzeBrand}
                    disabled={analyzing}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-white/[0.05] text-white/55 border border-white/[0.1] hover:bg-white/[0.08] transition-all disabled:opacity-50 disabled:cursor-wait"
                  >
                    <Sparkles className="w-3 h-3" />
                    {analyzing ? "Analyzing…" : "Analyze"}
                  </button>
                </div>

                {brandScore ? (
                  <>
                    <div className="flex items-center gap-4 mb-4">
                      <ScoreRing score={brandScore.overall} size={72} />
                      <div>
                        <div className="text-2xl font-bold text-white">
                          {brandScore.overall}<span className="text-sm text-white/35">/100</span>
                        </div>
                        <div className={`text-xs ${brandScore.overall >= 85 ? "text-emerald-400" : brandScore.overall >= 70 ? "text-white/60" : "text-amber-400"}`}>
                          {brandScore.label}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs text-white/45 mb-3">
                      {brandScore.breakdown.map(item => (
                        <div key={item.label}>
                          <div className="flex justify-between mb-1">
                            <span>{item.label}</span>
                            <span className="text-white/60">{item.score}%</span>
                          </div>
                          <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                            <motion.div
                              key={item.score}
                              initial={{ width: 0 }}
                              animate={{ width: `${item.score}%` }}
                              transition={{ duration: 0.8, delay: 0.1 }}
                              className="h-full bg-white/40 rounded-full"
                            />
                          </div>
                          {item.tip && <p className="text-[10px] text-white/35 mt-0.5 leading-relaxed">{item.tip}</p>}
                        </div>
                      ))}
                    </div>
                    {brandScore.gaps.length > 0 && (
                      <div className="rounded-lg bg-amber-500/5 border border-amber-500/15 p-2.5 mb-3">
                        {brandScore.gaps.map((g, i) => (
                          <p key={i} className="text-[10px] text-amber-300/70 leading-relaxed">{g}</p>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center py-4 text-center">
                    <div className="w-14 h-14 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-3">
                      <Brain className="w-6 h-6 text-white/25" />
                    </div>
                    <p className="text-xs text-white/35 leading-relaxed mb-3">
                      Click Analyze to get your real AI-powered brand score based on your portfolio content.
                    </p>
                  </div>
                )}
                <Link
                  href="/analytics"
                  className="mt-1 flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors"
                >
                  <Zap className="w-3 h-3" />
                  Full analytics
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Resume health summary */}
              {primaryResume && (
                <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-5">
                  <h3 className="text-sm font-semibold text-white/45 mb-4">Resume Health</h3>
                  <div className="space-y-3">
                    {[
                      {
                        label: "Summary",
                        ok: (primaryResume.summary?.length ?? 0) >= 80,
                        detail: (primaryResume.summary?.length ?? 0) >= 80
                          ? `${primaryResume.summary.length} characters`
                          : "Too short — add more detail",
                      },
                      {
                        label: "Experience bullets",
                        ok: primaryResume.experience?.reduce((n, e) => n + e.bullets.filter(b => b.text.trim()).length, 0) >= 4,
                        detail: `${primaryResume.experience?.reduce((n, e) => n + e.bullets.filter(b => b.text.trim()).length, 0) ?? 0} bullet points`,
                      },
                      {
                        label: "Skills coverage",
                        ok: (primaryResume.skills?.reduce((n, g) => n + g.items.length, 0) ?? 0) >= 6,
                        detail: `${primaryResume.skills?.reduce((n, g) => n + g.items.length, 0) ?? 0} skills listed`,
                      },
                      {
                        label: "Projects",
                        ok: (primaryResume.projects?.length ?? 0) >= 1,
                        detail: (primaryResume.projects?.length ?? 0) >= 1
                          ? `${primaryResume.projects.length} project${primaryResume.projects.length > 1 ? "s" : ""}`
                          : "No projects added yet",
                      },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center ${
                          item.ok ? "bg-emerald-500/15 border border-emerald-500/25" : "bg-amber-500/15 border border-amber-500/25"
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${item.ok ? "bg-emerald-400" : "bg-amber-400"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/45">{item.label}</p>
                          <p className="text-[10px] text-white/35 mt-0.5">{item.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
