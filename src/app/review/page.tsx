"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Star,
  MessageSquare,
  Check,
  Clock,
  Sparkles,
  ArrowRight,
  ThumbsUp,
  ChevronDown,
  Send,
  Eye,
  Crown,
  Target,
  Zap,
  AlertCircle,
  FileText,
  X,
} from "lucide-react";
import Link from "next/link";
import DashboardSidebar from "@/components/DashboardSidebar";

/* ── Types ── */
interface ResumeData {
  name: string;
  title: string;
  email: string;
  summary: string;
  experience: {
    id: string;
    company: string;
    role: string;
    period: string;
    bullets: { id: string; text: string }[];
  }[];
  skills: { id: string; category: string; items: string[] }[];
  projects: { id: string; name: string; desc: string; link: string; tags: string }[];
  education: { id: string; school: string; degree: string; period: string; gpa: string }[];
}

interface ReviewResult {
  overall: number;
  label: string;
  summary_verdict: string;
  critical_count: number;
  suggestion_count: number;
  strength_count: number;
  breakdown: { label: string; score: number; desc: string }[];
  feedback: { section: string; severity: string; comment: string }[];
}

interface FeedbackItem {
  section: string;
  severity: string;
  comment: string;
  resolved: boolean;
  suggestedText?: string;
  suggestionType?: "bullet" | "summary";
  suggestionExpId?: string;
}

const REVIEWERS = [
  {
    id: 1,
    name: "David Kim",
    title: "Senior Engineering Manager @ Meta",
    avatar: "DK",
    color: "from-blue-500 to-cyan-600",
    rating: 4.9,
    reviews: 147,
    specialties: ["Software Engineering", "ML/AI", "Backend"],
    turnaround: "< 48h",
    price: "Free",
    premium: false,
  },
  {
    id: 2,
    name: "Jennifer Walsh",
    title: "Head of Talent @ Stripe",
    avatar: "JW",
    color: "from-purple-500 to-indigo-600",
    rating: 5.0,
    reviews: 89,
    specialties: ["FinTech", "Frontend", "Product"],
    turnaround: "< 24h",
    price: "Pro",
    premium: true,
  },
  {
    id: 3,
    name: "Marcus Chen",
    title: "Principal Engineer @ Google",
    avatar: "MC",
    color: "from-emerald-500 to-teal-600",
    rating: 4.8,
    reviews: 203,
    specialties: ["Distributed Systems", "Infrastructure", "SRE"],
    turnaround: "< 72h",
    price: "Free",
    premium: false,
  },
  {
    id: 4,
    name: "Priya Nair",
    title: "Talent Director @ Figma",
    avatar: "PN",
    color: "from-pink-500 to-rose-600",
    rating: 4.9,
    reviews: 112,
    specialties: ["Design", "UX/UI", "Creative"],
    turnaround: "< 48h",
    price: "Pro",
    premium: true,
  },
];

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    critical: "bg-red-500/10 text-red-300 border-red-500/20",
    suggestion: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    positive: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  };
  const labels: Record<string, string> = {
    critical: "Must fix",
    suggestion: "Suggestion",
    positive: "Strength",
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${styles[severity] ?? styles.suggestion}`}>
      {labels[severity] ?? severity}
    </span>
  );
}

export default function ReviewPage() {
  const [activeTab, setActiveTab] = useState<"ai" | "human" | "aihumanizer">("ai");
  const [aiInput, setAiInput] = useState("");
  const [humanOutput, setHumanOutput] = useState("");
  const [humanizing, setHumanizing] = useState(false);
  const [outputCopied, setOutputCopied] = useState(false);
  const [bypass, setBypass] = useState<"standard" | "advanced" | "aggressive">("advanced");
  const [purpose, setPurpose] = useState("general");
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedFeedback, setExpandedFeedback] = useState<number | null>(null);
  const [fixingIndex, setFixingIndex] = useState<number | null>(null);
  const [selectedReviewer, setSelectedReviewer] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [requestSent, setRequestSent] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("folio_resume");
    if (stored) {
      try {
        setResume(JSON.parse(stored));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const analyzeResume = async () => {
    if (!resume) return;
    setAnalyzing(true);
    setResult(null);
    setFeedbackItems([]);
    setExpandedFeedback(null);
    const toastId = toast.loading("Analyzing your resume with AI…");
    try {
      const res = await fetch("/api/ai/resume-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setResult(json);
      setFeedbackItems(
        (json.feedback as ReviewResult["feedback"]).map((f) => ({ ...f, resolved: false }))
      );
      setExpandedFeedback(0);
      toast.dismiss(toastId);
      toast.success("Analysis complete!");
    } catch {
      toast.dismiss(toastId);
      toast.error("Could not analyze resume — check your connection");
    } finally {
      setAnalyzing(false);
    }
  };

  const markResolved = (index: number) => {
    setFeedbackItems((prev) =>
      prev.map((f, i) => (i === index ? { ...f, resolved: true } : f))
    );
    toast.success("Marked as resolved");
  };

  const applySuggestion = (index: number) => {
    const item = feedbackItems[index];
    if (!item?.suggestedText || !resume) return;
    let updated = { ...resume };
    if (item.suggestionType === "bullet" && item.suggestionExpId) {
      updated = {
        ...updated,
        experience: resume.experience.map((e) =>
          e.id === item.suggestionExpId
            ? { ...e, bullets: e.bullets.map((b, bi) => (bi === 0 ? { ...b, text: item.suggestedText! } : b)) }
            : e
        ),
      };
    } else if (item.suggestionType === "summary") {
      updated = { ...updated, summary: item.suggestedText };
    }
    localStorage.setItem("folio_resume", JSON.stringify(updated));
    setResume(updated);
    setFeedbackItems((prev) =>
      prev.map((f, i) =>
        i === index ? { ...f, resolved: true, suggestedText: undefined, suggestionType: undefined, suggestionExpId: undefined } : f
      )
    );
    toast.success("Applied to your resume!", {
      action: { label: "Open editor", onClick: () => router.push("/editor/resume") },
    });
  };

  const dismissSuggestion = (index: number) => {
    setFeedbackItems((prev) =>
      prev.map((f, i) =>
        i === index ? { ...f, suggestedText: undefined, suggestionType: undefined, suggestionExpId: undefined } : f
      )
    );
  };

  const fixWithAI = async (index: number) => {
    const item = feedbackItems[index];
    if (!item) return;
    if (!resume) {
      toast.error("Resume not loaded — try refreshing the page");
      return;
    }

    setFixingIndex(index);
    const toastId = toast.loading(`AI fixing "${item.section}"…`);

    try {
      const sectionLower = item.section.toLowerCase();

      // Experience bullet fix
      const expMatch = (resume.experience ?? []).find(
        (e) =>
          sectionLower.includes(e.company.toLowerCase()) ||
          sectionLower.includes(e.role.toLowerCase())
      );

      if (expMatch && (expMatch.bullets ?? []).length > 0 && item.severity !== "positive") {
        const res = await fetch("/api/ai/enhance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bullet: expMatch.bullets[0].text,
            mode: "professional",
            role: expMatch.role,
            company: expMatch.company,
            allBullets: expMatch.bullets.map((b) => b.text),
          }),
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error);

        setFeedbackItems((prev) =>
          prev.map((f, i) =>
            i === index
              ? { ...f, suggestedText: json.text, suggestionType: "bullet", suggestionExpId: expMatch.id }
              : f
          )
        );
        toast.success("AI suggestion ready — review below", { id: toastId });

      } else if (
        sectionLower.includes("summary") ||
        sectionLower.includes("ats") ||
        sectionLower.includes("keyword")
      ) {
        const mode = sectionLower.includes("ats") || sectionLower.includes("keyword")
          ? "corporate"
          : "professional";
        const res = await fetch("/api/ai/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            current: resume.summary,
            mode,
            role: resume.title,
            title: resume.title,
            experience: resume.experience,
          }),
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error);

        setFeedbackItems((prev) =>
          prev.map((f, i) =>
            i === index
              ? { ...f, suggestedText: json.text, suggestionType: "summary" }
              : f
          )
        );
        toast.success("AI suggestion ready — review below", { id: toastId });

      } else {
        setFeedbackItems((prev) =>
          prev.map((f, i) => (i === index ? { ...f, resolved: true } : f))
        );
        toast.success("Noted! Apply this fix in the editor.", {
          id: toastId,
          action: { label: "Open editor", onClick: () => router.push("/editor/resume") },
        });
      }
    } catch {
      toast.error("AI fix failed — try again", { id: toastId });
    } finally {
      setFixingIndex(null);
    }
  };

  const fixAllWithAI = async () => {
    if (!resume || !feedbackItems.length) return;
    const unresolved = feedbackItems.filter((f) => !f.resolved && f.severity !== "positive");
    if (!unresolved.length) {
      toast("All issues already resolved!");
      return;
    }

    setFixingIndex(-1);
    const toastId = toast.loading(`AI fixing ${unresolved.length} issues…`);

    try {
      let suggestionCount = 0;
      const itemUpdates: Record<number, Partial<FeedbackItem>> = {};

      for (const item of unresolved) {
        const index = feedbackItems.indexOf(item);
        const sectionLower = item.section.toLowerCase();
        const expMatch = (resume.experience ?? []).find(
          (e) =>
            sectionLower.includes(e.company.toLowerCase()) ||
            sectionLower.includes(e.role.toLowerCase())
        );

        if (expMatch && (expMatch.bullets ?? []).length > 0) {
          try {
            const res = await fetch("/api/ai/enhance", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                bullet: expMatch.bullets[0].text,
                mode: "professional",
                role: expMatch.role,
                company: expMatch.company,
                allBullets: expMatch.bullets.map((b) => b.text),
              }),
            });
            const json = await res.json();
            if (!json.error) {
              itemUpdates[index] = { suggestedText: json.text, suggestionType: "bullet", suggestionExpId: expMatch.id };
              suggestionCount++;
            }
          } catch { /* continue */ }
        } else if (sectionLower.includes("summary") || sectionLower.includes("ats") || sectionLower.includes("keyword")) {
          try {
            const res = await fetch("/api/ai/summary", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ current: resume.summary, mode: "professional", role: resume.title, title: resume.title, experience: resume.experience }),
            });
            const json = await res.json();
            if (!json.error) {
              itemUpdates[index] = { suggestedText: json.text, suggestionType: "summary" };
              suggestionCount++;
            }
          } catch { /* continue */ }
        } else {
          itemUpdates[index] = { resolved: true };
          suggestionCount++;
        }
      }

      setFeedbackItems((prev) =>
        prev.map((f, i) => (itemUpdates[i] ? { ...f, ...itemUpdates[i] } : f))
      );
      toast.success(`${suggestionCount} AI suggestions ready — review and apply below`, { id: toastId });
    } catch {
      toast.error("Something went wrong — try again", { id: toastId });
    } finally {
      setFixingIndex(null);
    }
  };

  const handleRequestReview = (reviewer: (typeof REVIEWERS)[0]) => {
    setRequestSent(reviewer.id);
    toast.success(`Review request sent to ${reviewer.name}!`, {
      description: `Expected response in ${reviewer.turnaround}`,
    });
  };

  const unresolvedCount = feedbackItems.filter((f) => !f.resolved && f.severity !== "positive").length;

  return (
    <div className="flex min-h-screen bg-[#050508]">
      <DashboardSidebar />

      <main className="flex-1 ml-[220px] min-h-screen">
        {/* Top bar */}
        <div className="h-16 border-b border-white/[0.05] flex items-center justify-between px-8 bg-[#050508]/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-white/50" />
            <h1 className="font-semibold">Recruiter Review</h1>
          </div>
          <div className="flex items-center gap-1 bg-white/[0.05] rounded-xl p-1">
            {(
              [
                ["ai", "AI Analysis"],
                ["human", "Human Review"],
                ["aihumanizer", "AI Humanizer"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === id
                    ? "bg-white/[0.08] text-white"
                    : "text-white/35 hover:text-white/45"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {/* AI Analysis tab */}
            {activeTab === "ai" && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* No resume state */}
                {!resume && (
                  <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-12 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-white/25" />
                    </div>
                    <h3 className="font-semibold text-white/60 mb-2">No resume found</h3>
                    <p className="text-sm text-white/35 mb-5 max-w-sm">
                      Build your resume in the editor first, then come back for a full AI analysis.
                    </p>
                    <Link
                      href="/editor/resume"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#060608] text-sm font-medium hover:bg-white/90 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Open Resume Editor
                    </Link>
                  </div>
                )}

                {/* Resume found but not yet analyzed */}
                {resume && !result && !analyzing && (
                  <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-8 flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold mb-2">Ready to analyze</h2>
                      <p className="text-white/45 text-sm leading-relaxed">
                        Resume found: <span className="text-white/80 font-medium">{resume.name} — {resume.title}</span>
                      </p>
                      <p className="text-white/35 text-xs mt-1">
                        {resume.experience?.length ?? 0} experience entries · {resume.skills?.length ?? 0} skill groups · {resume.projects?.length ?? 0} projects
                      </p>
                    </div>
                    <button
                      onClick={analyzeResume}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#060608] font-medium hover:bg-white/90 transition-colors flex-shrink-0"
                    >
                      <Sparkles className="w-5 h-5" />
                      Analyze my resume
                    </button>
                  </div>
                )}

                {/* Analyzing state */}
                {analyzing && (
                  <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-12 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-8 h-8 text-white/45" />
                      </motion.div>
                    </div>
                    <h3 className="font-semibold text-white/60 mb-2">Analyzing your resume…</h3>
                    <p className="text-sm text-white/35">
                      AI is reviewing every section for ATS fit, impact clarity, and recruiter readability.
                    </p>
                  </div>
                )}

                {/* Analysis results */}
                {result && (
                  <>
                    {/* Overall score */}
                    <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-8">
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                        {/* Score circle */}
                        <div className="relative w-32 h-32 flex-shrink-0">
                          <svg width="128" height="128" className="-rotate-90">
                            <circle
                              cx="64" cy="64" r="52"
                              fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10"
                            />
                            <motion.circle
                              cx="64" cy="64" r="52"
                              fill="none" stroke="url(#scoreGrad)" strokeWidth="10" strokeLinecap="round"
                              strokeDasharray={2 * Math.PI * 52}
                              initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                              animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - result.overall / 100) }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                            <defs>
                              <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
                                <stop offset="100%" stopColor="rgba(255,255,255,0.9)" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-white">{result.overall}</span>
                            <span className="text-xs text-white/35">/ 100</span>
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-xl font-bold">{result.label}</h2>
                            <span className={`px-2 py-0.5 rounded-full text-xs border ${
                              result.overall >= 85
                                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                                : result.overall >= 70
                                ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                                : "bg-red-500/10 text-red-300 border-red-500/20"
                            }`}>
                              {result.overall >= 85 ? "Strong" : result.overall >= 70 ? "Needs work" : "Critical gaps"}
                            </span>
                          </div>
                          <p className="text-white/45 text-sm leading-relaxed mb-5">
                            {result.summary_verdict}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-400" />
                              <span className="text-white/35">{result.critical_count} critical</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-amber-400" />
                              <span className="text-white/35">{result.suggestion_count} suggestions</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-400" />
                              <span className="text-white/35">{result.strength_count} strengths</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <button
                            onClick={fixAllWithAI}
                            disabled={fixingIndex !== null || unresolvedCount === 0}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#060608] text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-wait"
                          >
                            <Sparkles className="w-4 h-4" />
                            {fixingIndex === -1 ? "Fixing…" : `Fix all (${unresolvedCount})`}
                          </button>
                          <button
                            onClick={analyzeResume}
                            disabled={analyzing}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white/45 text-sm hover:bg-white/[0.06] transition-all disabled:opacity-50"
                          >
                            <Eye className="w-4 h-4" />
                            Re-analyze
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Score breakdown */}
                    <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-6">
                      <h2 className="text-sm font-semibold mb-5">Score Breakdown</h2>
                      <div className="space-y-5">
                        {result.breakdown.map((item, i) => (
                          <div key={item.label}>
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <span className="text-sm font-medium text-white/80">{item.label}</span>
                                <p className="text-xs text-white/35 mt-0.5">{item.desc}</p>
                              </div>
                              <span
                                className={`text-lg font-bold flex-shrink-0 ml-4 ${
                                  item.score >= 85
                                    ? "text-emerald-400"
                                    : item.score >= 70
                                    ? "text-white/70"
                                    : "text-amber-400"
                                }`}
                              >
                                {item.score}
                              </span>
                            </div>
                            <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.score}%` }}
                                transition={{ duration: 0.8, delay: i * 0.1 }}
                                className={`h-full rounded-full ${
                                  item.score >= 85
                                    ? "bg-emerald-500"
                                    : item.score >= 70
                                    ? "bg-white/[0.45]"
                                    : "bg-amber-500"
                                }`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Feedback items */}
                    <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] overflow-hidden">
                      <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
                        <h2 className="text-sm font-semibold">Detailed Feedback</h2>
                        {unresolvedCount > 0 && (
                          <span className="text-xs text-white/35">
                            {unresolvedCount} unresolved
                          </span>
                        )}
                      </div>
                      <div className="divide-y divide-white/[0.03]">
                        {feedbackItems.map((item, i) => (
                          <div key={i} className={`p-5 ${item.resolved ? "opacity-50" : ""}`}>
                            <button
                              onClick={() =>
                                setExpandedFeedback(expandedFeedback === i ? null : i)
                              }
                              className="w-full flex items-start justify-between text-left"
                            >
                              <div className="flex items-start gap-3">
                                {item.resolved ? (
                                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  </div>
                                ) : (
                                  <div
                                    className={`w-5 h-5 rounded-full flex-shrink-0 mt-0.5 ${
                                      item.severity === "critical"
                                        ? "bg-red-500/20 border border-red-500/30"
                                        : item.severity === "positive"
                                        ? "bg-emerald-500/20 border border-emerald-500/30"
                                        : "bg-amber-500/20 border border-amber-500/30"
                                    }`}
                                  />
                                )}
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-white/80">
                                      {item.section}
                                    </span>
                                    <SeverityBadge severity={item.severity} />
                                    {item.resolved && (
                                      <span className="text-[10px] text-white/35">Resolved</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <ChevronDown
                                className={`w-4 h-4 text-white/35 flex-shrink-0 ml-3 transition-transform ${
                                  expandedFeedback === i ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                            <AnimatePresence>
                              {expandedFeedback === i && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="pt-3 pl-8">
                                    <p className="text-sm text-white/45 leading-relaxed mb-4">
                                      {item.comment}
                                    </p>
                                    {/* AI Suggestion panel */}
                                    {item.suggestedText && !item.resolved && (
                                      <div className="mb-4 rounded-xl bg-white/[0.04] border border-white/[0.08] p-4">
                                        <div className="flex items-center gap-2 mb-2.5">
                                          <Sparkles className="w-3.5 h-3.5 text-white/50" />
                                          <span className="text-xs font-medium text-white/60">AI Suggestion</span>
                                          <span className="text-[10px] text-white/25 ml-auto">Review before applying</span>
                                        </div>
                                        <p className="text-sm text-white/75 leading-relaxed mb-3">{item.suggestedText}</p>
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => applySuggestion(i)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[#060608] text-xs font-medium hover:bg-white/90 transition-all"
                                          >
                                            <Check className="w-3 h-3" />
                                            Apply
                                          </button>
                                          <button
                                            onClick={() => dismissSuggestion(i)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] text-white/45 text-xs border border-white/[0.08] hover:bg-white/[0.06] transition-all"
                                          >
                                            <X className="w-3 h-3" />
                                            Dismiss
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                    {!item.resolved && (
                                      <div className="flex gap-2">
                                        {item.severity !== "positive" && !item.suggestedText && (
                                          <button
                                            onClick={() => fixWithAI(i)}
                                            disabled={fixingIndex === i}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] text-white/55 text-xs border border-white/[0.1] hover:bg-white/[0.08] transition-all disabled:opacity-50 disabled:cursor-wait"
                                          >
                                            <Sparkles className="w-3.5 h-3.5" />
                                            {fixingIndex === i ? "Generating…" : "Fix with AI"}
                                          </button>
                                        )}
                                        <button
                                          onClick={() => markResolved(i)}
                                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] text-white/45 text-xs border border-white/[0.08] hover:bg-white/[0.06] transition-all"
                                        >
                                          <ThumbsUp className="w-3.5 h-3.5" />
                                          Mark resolved
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* All resolved state */}
                    {unresolvedCount === 0 && feedbackItems.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-6 flex items-center gap-4"
                      >
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                          <Check className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-emerald-300 mb-1">All issues resolved!</h3>
                          <p className="text-sm text-white/35">
                            Re-analyze to get an updated score after your edits.
                          </p>
                        </div>
                        <button
                          onClick={analyzeResume}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 text-emerald-300 text-sm border border-emerald-500/20 hover:bg-emerald-500/25 transition-all flex-shrink-0"
                        >
                          <Sparkles className="w-4 h-4" />
                          Re-analyze
                        </button>
                      </motion.div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* Human review tab */}
            {activeTab === "human" && (
              <motion.div
                key="human"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {!resume && (
                  <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <p className="text-sm text-amber-300/80">
                      Build your resume first so reviewers have something to review.{" "}
                      <Link href="/editor/resume" className="underline">Open editor →</Link>
                    </p>
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold mb-1">Get expert feedback</h2>
                    <p className="text-white/35 text-sm">Real reviewers from top companies. Free slots available.</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/35">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Average response: 36 hours</span>
                  </div>
                </div>

                {/* Reviewer cards */}
                <div className="grid md:grid-cols-2 gap-4">
                  {REVIEWERS.map((reviewer, i) => (
                    <motion.div
                      key={reviewer.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      onClick={() =>
                        setSelectedReviewer(
                          selectedReviewer === reviewer.id ? null : reviewer.id
                        )
                      }
                      className={`rounded-2xl border p-5 cursor-pointer transition-all ${
                        selectedReviewer === reviewer.id
                          ? "bg-white/[0.04] border-white/[0.15]"
                          : "bg-white/[0.025] border-white/[0.06] hover:border-white/[0.1]"
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <div
                          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${reviewer.color} flex items-center justify-center text-sm font-bold text-white flex-shrink-0`}
                        >
                          {reviewer.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-sm font-semibold text-white/90">{reviewer.name}</h3>
                              <p className="text-xs text-white/35 mt-0.5">{reviewer.title}</p>
                            </div>
                            {reviewer.premium ? (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                <Crown className="w-2.5 h-2.5" />
                                Pro
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                Free
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {reviewer.specialties.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded-md text-[10px] bg-white/[0.05] text-white/35 border border-white/[0.08]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-amber-400">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{reviewer.rating}</span>
                          <span className="text-white/35">({reviewer.reviews} reviews)</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-white/35">
                          <Clock className="w-3 h-3" />
                          {reviewer.turnaround}
                        </div>
                      </div>

                      {selectedReviewer === reviewer.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-4 pt-4 border-t border-white/[0.06]"
                        >
                          <p className="text-xs text-white/35 mb-3">
                            Add a note for the reviewer (optional):
                          </p>
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="e.g. 'Targeting senior frontend roles at Series B startups. Please focus on my project section...'"
                            className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-xs text-white/60 placeholder:text-white/25 resize-none focus:outline-none focus:border-white/[0.15] transition-colors"
                            rows={3}
                          />
                          <button
                            onClick={() => handleRequestReview(reviewer)}
                            disabled={requestSent === reviewer.id}
                            className={`mt-2 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                              requestSent === reviewer.id
                                ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 cursor-default"
                                : "bg-white text-[#060608] hover:bg-white/90"
                            }`}
                          >
                            {requestSent === reviewer.id ? (
                              <>
                                <Check className="w-4 h-4" />
                                Request Sent!
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                Request Review
                                <span className="opacity-60">— {reviewer.price}</span>
                              </>
                            )}
                          </button>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Mock interview */}
                <div className="rounded-2xl bg-gradient-to-br from-cyan-600/10 to-blue-600/5 border border-cyan-500/20 p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">AI Mock Interview</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          Beta
                        </span>
                      </div>
                      <p className="text-sm text-white/35 mb-4 leading-relaxed">
                        Practice with an AI interviewer trained on real FAANG interview patterns.
                        Personalized to your resume and target companies.
                      </p>
                      <button
                        onClick={() =>
                          toast("Starting mock interview session… (Beta)", {
                            description:
                              "AI interviewer personalized to your resume and target companies",
                          })
                        }
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        <Zap className="w-4 h-4" />
                        Start mock interview
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Smart network */}
                <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-rose-400" />
                    <h3 className="font-semibold">Smart Networking Suggestions</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-pink-500/10 text-pink-300 border border-pink-500/20">
                      AI
                    </span>
                  </div>
                  <div className="space-y-3">
                    {[
                      "Connect with 3 engineers at Stripe who went to similar bootcamps",
                      "2 hiring managers at your target companies follow the same people you do on Twitter",
                      "A PM at Vercel liked your open-source repo — reach out now while warm",
                    ].map((suggestion, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.05] transition-all cursor-pointer group"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
                        <p className="text-sm text-white/45 group-hover:text-white/80 transition-colors flex-1">
                          {suggestion}
                        </p>
                        <ArrowRight className="w-3.5 h-3.5 text-white/25 group-hover:text-rose-400 transition-colors flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "aihumanizer" && (
              <motion.div
                key="aihumanizer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {/* Header */}
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-1">AI Humanizer</h2>
                  <p className="text-sm text-white/40">
                    Paste AI text — get back writing that bypasses GPTZero, Turnitin, Originality.ai, and Copyleaks.
                  </p>
                </div>

                {/* Controls row */}
                <div className="flex items-center gap-4 mb-5 flex-wrap">
                  {/* Bypass level */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold text-white/35 uppercase tracking-widest">Bypass Level</span>
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.05]">
                      {(["standard", "advanced", "aggressive"] as const).map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => setBypass(lvl)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                            bypass === lvl
                              ? lvl === "aggressive"
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : lvl === "advanced"
                                ? "bg-white/[0.08] text-white/80 border border-white/[0.12]"
                                : "bg-white/[0.1] text-white border border-white/15"
                              : "text-white/30 hover:text-white/60"
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Purpose */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold text-white/35 uppercase tracking-widest">Purpose</span>
                    <select
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      className="h-9 px-3 pr-8 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white/80 focus:outline-none focus:border-white/[0.15] appearance-none cursor-pointer"
                    >
                      <option value="general">General</option>
                      <option value="essay">Essay</option>
                      <option value="article">Article / Blog</option>
                      <option value="cover_letter">Cover Letter</option>
                      <option value="email">Email</option>
                      <option value="social">LinkedIn / Social</option>
                      <option value="report">Business Report</option>
                    </select>
                  </div>
                </div>

                {/* Side-by-side panels */}
                <div className="grid grid-cols-2 gap-4">
                  {/* LEFT — Input */}
                  <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.05]">
                      <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">Your AI Text</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-white/25">
                          {aiInput.trim() ? aiInput.trim().split(/\s+/).length : 0} words
                        </span>
                        {aiInput && (
                          <button
                            onClick={() => { setAiInput(""); setHumanOutput(""); }}
                            className="text-[11px] text-white/25 hover:text-white/60 transition-colors"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                    <textarea
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      placeholder="Paste your AI-generated text here..."
                      className="flex-1 min-h-[340px] w-full bg-transparent p-4 text-sm text-white/80 placeholder:text-white/20 resize-none focus:outline-none leading-relaxed"
                    />
                    <div className="px-4 py-3 border-t border-white/[0.05] flex justify-end">
                      <button
                        onClick={async () => {
                          if (!aiInput.trim() || humanizing) return;
                          setHumanizing(true);
                          setHumanOutput("");
                          const toastId = toast.loading("Humanizing your text...");
                          try {
                            const res = await fetch("/api/ai/humanize", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ text: aiInput, bypass, purpose }),
                            });
                            const json = await res.json();
                            if (json.error) throw new Error(json.error);
                            setHumanOutput(json.output);
                            toast.success("Humanized successfully", { id: toastId });
                          } catch {
                            toast.error("Failed to humanize — try again", { id: toastId });
                          } finally {
                            setHumanizing(false);
                          }
                        }}
                        disabled={!aiInput.trim() || humanizing}
                        className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-white text-[#060608] text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {humanizing ? (
                          <>
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                              className="block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full"
                            />
                            Humanizing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            Humanize
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* RIGHT — Output */}
                  <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.05]">
                      <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">Humanized Text</span>
                      {humanOutput && (
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-white/25">
                            {humanOutput.trim().split(/\s+/).length} words
                          </span>
                          <button
                            onClick={async () => {
                              await navigator.clipboard.writeText(humanOutput);
                              setOutputCopied(true);
                              setTimeout(() => setOutputCopied(false), 2000);
                            }}
                            className="flex items-center gap-1.5 text-[11px] font-medium text-white/50 hover:text-white/70 transition-colors"
                          >
                            {outputCopied
                              ? <><Check className="w-3 h-3" /> Copied!</>
                              : <><FileText className="w-3 h-3" /> Copy</>}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-h-[340px] p-4 text-sm leading-relaxed overflow-y-auto">
                      {humanOutput ? (
                        <p className="text-white/80 whitespace-pre-wrap">{humanOutput}</p>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center gap-3 text-white/15">
                          <Sparkles className="w-9 h-9 opacity-20" />
                          <p>Humanized output will appear here</p>
                        </div>
                      )}
                    </div>

                    <div className="px-4 py-3 border-t border-white/[0.05]">
                      <p className="text-[11px] text-white/20">
                        {humanOutput
                          ? "Targets GPTZero perplexity + burstiness scores"
                          : "Supports GPTZero, Turnitin, Originality.ai, Copyleaks"}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
