"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Eye,
  TrendingUp,
  Clock,
  Users,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  BarChart3,
  MousePointer,
  MapPin,
} from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";

const TIMEFRAMES = ["7 days", "30 days", "90 days", "All time"];

const RECRUITER_VISITS = [
  {
    company: "Google",
    logo: "G",
    color: "from-blue-500 to-cyan-500",
    recruiter: "Senior Recruiter",
    timeAgo: "2h ago",
    duration: "4m 32s",
    sections: ["Experience", "Projects", "Skills"],
    score: 92,
  },
  {
    company: "Stripe",
    logo: "S",
    color: "from-purple-500 to-indigo-500",
    recruiter: "Engineering Talent",
    timeAgo: "5h ago",
    duration: "2m 18s",
    sections: ["Skills", "Experience"],
    score: 78,
  },
  {
    company: "Vercel",
    logo: "V",
    color: "from-slate-600 to-slate-800",
    recruiter: "Head of People",
    timeAgo: "1d ago",
    duration: "6m 05s",
    sections: ["Experience", "Projects", "About", "Skills"],
    score: 96,
  },
  {
    company: "Linear",
    logo: "L",
    color: "from-indigo-600 to-purple-700",
    recruiter: "Talent Partner",
    timeAgo: "2d ago",
    duration: "1m 44s",
    sections: ["Experience"],
    score: 64,
  },
];

const WEEKLY_DATA = [12, 18, 15, 24, 19, 28, 34, 22, 31, 27, 35, 42, 38, 45];

function SparklineChart({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 200;
  const h = 48;
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((val - min) / range) * (h - 8) - 4;
    return `${x},${y}`;
  });

  return (
    <svg width={w} height={h} className="overflow-visible">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.25)" stopOpacity={1} />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" stopOpacity={1} />
        </linearGradient>
      </defs>
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points={`0,${h} ${points.join(" ")} ${w},${h}`}
        fill="url(#sparkGrad)"
      />
    </svg>
  );
}

function BarChart({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const days = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="flex items-end gap-1.5 h-24">
      {data.slice(-7).map((val, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(val / max) * 80}%` }}
            transition={{ duration: 0.6, delay: i * 0.05 }}
            className="w-full rounded-t-md bg-white/[0.25] min-h-[4px]"
          />
          <span className="text-[9px] text-white/35">{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

function HeatmapSection({ label, intensity }: { label: string; intensity: number }) {
  const bg = `rgba(255, 255, 255, ${intensity * 0.07})`;
  return (
    <div className="rounded-lg overflow-hidden border border-white/[0.05]">
      <div className="h-8 flex items-center px-3 relative" style={{ background: bg }}>
        <span className="text-xs text-white/80 font-medium">{label}</span>
        <span className="ml-auto text-xs text-white/45">{Math.round(intensity * 100)}% attention</span>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState("30 days");
  const router = useRouter();

  return (
    <div className="flex min-h-screen bg-[#050508]">
      <DashboardSidebar />

      <main className="flex-1 ml-[220px] min-h-screen">
        {/* Top bar */}
        <div className="h-16 border-b border-white/[0.05] flex items-center justify-between px-8 bg-[#050508]/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-white/50" />
            <h1 className="font-semibold">Analytics</h1>
          </div>
          <div className="flex items-center gap-1 bg-white/[0.02] rounded-lg p-1">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  timeframe === tf ? "bg-white/[0.08] text-white/90" : "text-white/35 hover:text-white/45"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Key metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Portfolio Views",
                value: "1,247",
                change: "+23%",
                up: true,
                icon: Eye,
                color: "text-white/55",
                bg: "from-white/[0.04] to-transparent",
              },
              {
                label: "Recruiter Visits",
                value: "38",
                change: "+12%",
                up: true,
                icon: Users,
                color: "text-white/55",
                bg: "from-white/[0.04] to-transparent",
              },
              {
                label: "Avg. Session",
                value: "3m 22s",
                change: "+45s",
                up: true,
                icon: Clock,
                color: "text-sky-400",
                bg: "from-cyan-500/10 to-cyan-500/5",
              },
              {
                label: "Resume Opens",
                value: "89",
                change: "-4%",
                up: false,
                icon: MousePointer,
                color: "text-pink-600",
                bg: "from-pink-500/10 to-pink-500/5",
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`rounded-2xl bg-gradient-to-br ${stat.bg} border border-white/[0.06] p-5`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <div className={`flex items-center gap-0.5 text-xs ${stat.up ? "text-emerald-400" : "text-red-500"}`}>
                    {stat.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {stat.change}
                  </div>
                </div>
                <div className="text-2xl font-bold mb-0.5">{stat.value}</div>
                <div className="text-xs text-white/35">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Traffic chart */}
            <div className="lg:col-span-2 rounded-2xl bg-white/[0.025] border border-white/[0.06] p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-sm font-semibold">Portfolio Traffic</h2>
                  <p className="text-xs text-white/35 mt-0.5">Views per day over last 30 days</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-white/35">Total:</span>
                  <span className="font-semibold text-white/70">1,247</span>
                </div>
              </div>
              <div className="flex items-end gap-2 h-40 mb-4">
                {WEEKLY_DATA.map((val, i) => {
                  const max = Math.max(...WEEKLY_DATA);
                  const height = (val / max) * 100;
                  return (
                    <div key={i} className="flex-1 flex items-end">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 0.5, delay: i * 0.03 }}
                        className={`w-full rounded-t-lg ${
                          i === WEEKLY_DATA.length - 1
                            ? "bg-white/[0.45]"
                            : "bg-white/[0.06] hover:bg-white/[0.07] transition-colors"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-white/25">
                <span>2 weeks ago</span>
                <span>1 week ago</span>
                <span>Today</span>
              </div>
            </div>

            {/* Traffic sources */}
            <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-6">
              <h2 className="text-sm font-semibold mb-5">Traffic Sources</h2>
              <div className="space-y-4">
                {[
                  { source: "LinkedIn", value: 42, color: "bg-blue-500" },
                  { source: "Direct link", value: 28, color: "bg-white/50" },
                  { source: "Google", value: 16, color: "bg-emerald-500" },
                  { source: "GitHub", value: 9, color: "bg-slate-500" },
                  { source: "Twitter / X", value: 5, color: "bg-sky-500" },
                ].map(src => (
                  <div key={src.source}>
                    <div className="flex justify-between text-xs text-white/45 mb-1.5">
                      <span>{src.source}</span>
                      <span className="font-medium text-white/60">{src.value}%</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${src.value}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full rounded-full ${src.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-white/[0.05]">
                <div className="flex items-center gap-2 text-xs text-white/35">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Top countries: US, UK, CA, IN, DE</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recruiter visits */}
            <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold">Recruiter Activity</h2>
                <div className="flex items-center gap-1.5 text-xs text-white/40">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI identified
                </div>
              </div>
              <div className="space-y-3">
                {RECRUITER_VISITS.map((visit, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.02] transition-all group"
                  >
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${visit.color} flex items-center justify-center text-sm font-bold text-white flex-shrink-0`}>
                      {visit.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white/80">{visit.company}</span>
                        <span className="text-[10px] text-white/35">{visit.timeAgo}</span>
                      </div>
                      <div className="text-xs text-white/35 mt-0.5">{visit.recruiter} · {visit.duration}</div>
                      <div className="flex gap-1 mt-1.5">
                        {visit.sections.map(s => (
                          <span key={s} className="px-1.5 py-0.5 rounded text-[9px] bg-white/[0.05] text-white/45 border border-white/[0.07]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${visit.score >= 85 ? "text-emerald-400" : visit.score >= 70 ? "text-white/70" : "text-amber-400"}`}>
                        {visit.score}
                      </div>
                      <div className="text-[10px] text-white/35">interest</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Heatmap */}
            <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold">Resume Heatmap</h2>
                <div className="text-xs text-white/35">Where recruiters look most</div>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Header & Contact Info", intensity: 0.95 },
                  { label: "Work Experience — Acme Corp", intensity: 0.88 },
                  { label: "Skills Section", intensity: 0.76 },
                  { label: "Projects — Dashboard App", intensity: 0.72 },
                  { label: "Work Experience — Startup XYZ", intensity: 0.54 },
                  { label: "Education", intensity: 0.31 },
                  { label: "Certifications", intensity: 0.12 },
                ].map(section => (
                  <HeatmapSection key={section.label} {...section} />
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3 text-[10px] text-white/35">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-white/[0.06]" />
                  Low attention
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-white/[0.3]" />
                  High attention
                </div>
              </div>
            </div>
          </div>

          {/* AI insights */}
          <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-white/45" />
              <h2 className="text-sm font-semibold">AI Insights</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  insight: "Recruiters from tech companies spend 40% more time on your Projects section than industry average",
                  action: "Add 2 more projects",
                  impact: "high",
                  onClick: () => router.push("/editor/resume"),
                },
                {
                  insight: "Your portfolio bounce rate is 58% — visitors leave before reaching the Contact section",
                  action: "Move contact higher",
                  impact: "high",
                  onClick: () => router.push("/editor/portfolio"),
                },
                {
                  insight: "3 recruiters viewed your profile from the same LinkedIn post — consider posting more content",
                  action: "Build in public mode",
                  impact: "medium",
                  onClick: () => toast("Build in public mode coming soon!", { description: "Share your work-in-progress directly from Folio.ai" }),
                },
              ].map((item, i) => (
                <div key={i} className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4">
                  <p className="text-sm text-white/60 leading-relaxed mb-3">{item.insight}</p>
                  <button onClick={item.onClick} className="flex items-center gap-1 text-xs text-white/50 hover:text-white/70 transition-colors">
                    {item.action}
                    <TrendingUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
