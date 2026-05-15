"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Download, ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

/* ── Types ── */
interface Bullet    { id: string; text: string }
interface ExpEntry  { id: string; company: string; role: string; period: string; bullets: Bullet[] }
interface EduEntry  { id: string; school: string; degree: string; period: string; gpa: string }
interface Project   { id: string; name: string; desc: string; link: string; tags: string }
interface SkillGroup{ id: string; category: string; items: string[] }
interface ResumeData {
  name: string; title: string; email: string; phone: string;
  location: string; website: string; linkedin: string; github: string;
  summary: string;
  experience: ExpEntry[];
  education: EduEntry[];
  skills: SkillGroup[];
  projects: Project[];
  _templateId?: string;
}

interface TemplateStyle {
  id: string; label: string;
  bg: string; headerBg?: string; headerText?: string;
  bodyText: string; mutedText: string; accentText: string;
  sectionLabel: string; divider: string;
  tagBg: string; tagText: string;
  fontFamily?: string;
}

const TEMPLATES: TemplateStyle[] = [
  { id: "classic",   label: "Classic",
    bg: "#ffffff", bodyText: "#1a1a1a", mutedText: "#6b7280", accentText: "#374151",
    sectionLabel: "#9ca3af", divider: "#e5e7eb", tagBg: "#f3f4f6", tagText: "#6b7280" },
  { id: "modern",    label: "Modern",
    bg: "#ffffff", bodyText: "#0f172a", mutedText: "#475569", accentText: "#1d4ed8",
    sectionLabel: "#1d4ed8", divider: "#e2e8f0", tagBg: "#eff6ff", tagText: "#1d4ed8" },
  { id: "minimal",   label: "Minimal",
    bg: "#ffffff", bodyText: "#111111", mutedText: "#888888", accentText: "#333333",
    sectionLabel: "#cccccc", divider: "#f0f0f0", tagBg: "#fafafa", tagText: "#888888" },
  { id: "executive", label: "Executive",
    bg: "#ffffff", headerBg: "#111827", headerText: "#ffffff",
    bodyText: "#111827", mutedText: "#6b7280", accentText: "#111827",
    sectionLabel: "#111827", divider: "#e5e7eb", tagBg: "#f9fafb", tagText: "#374151" },
  { id: "tech",      label: "Tech",
    bg: "#f8fafc", bodyText: "#0f172a", mutedText: "#64748b", accentText: "#059669",
    sectionLabel: "#059669", divider: "#e2e8f0", tagBg: "#ecfdf5", tagText: "#065f46",
    fontFamily: "'Courier New', Courier, monospace" },
  { id: "bold",      label: "Bold",
    bg: "#ffffff", bodyText: "#111111", mutedText: "#6b7280", accentText: "#dc2626",
    sectionLabel: "#dc2626", divider: "#fee2e2", tagBg: "#fff1f2", tagText: "#dc2626" },
];

/* ── Resume renderer ── */
function Section({ label, tmpl, children }: { label: string; tmpl: TemplateStyle; children: React.ReactNode }) {
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
    <div style={{ background: tmpl.bg, color: tmpl.bodyText, fontFamily: ff, minHeight: "100%" }}>
      {tmpl.headerBg ? (
        <div style={{ background: tmpl.headerBg, color: tmpl.headerText, padding: "32px 40px 28px", marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>{data.name}</h1>
          <p style={{ fontSize: 13, opacity: 0.7, margin: "0 0 6px" }}>{data.title}</p>
          <p style={{ fontSize: 11, opacity: 0.5, margin: 0 }}>{[data.email, data.phone, data.location].filter(Boolean).join(" · ")}</p>
          {(data.linkedin || data.github || data.website) && (
            <p style={{ fontSize: 11, opacity: 0.4, margin: "4px 0 0" }}>{[data.linkedin, data.github, data.website].filter(Boolean).join(" · ")}</p>
          )}
        </div>
      ) : (
        <div style={{ padding: "32px 40px 0", marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em", color: tmpl.bodyText, fontFamily: ff }}>{data.name}</h1>
          <p style={{ fontSize: 13, color: tmpl.mutedText, margin: "0 0 4px" }}>{data.title}</p>
          <p style={{ fontSize: 11, color: tmpl.mutedText, margin: 0 }}>{[data.email, data.phone, data.location].filter(Boolean).join(" · ")}</p>
          {(data.linkedin || data.github || data.website) && (
            <p style={{ fontSize: 11, color: tmpl.mutedText, margin: "4px 0 0" }}>{[data.linkedin, data.github, data.website].filter(Boolean).join(" · ")}</p>
          )}
        </div>
      )}
      <div style={{ padding: tmpl.headerBg ? "0 40px 32px" : "0 40px 32px" }}>
        {data.summary && (
          <Section label="Summary" tmpl={tmpl}>
            <p style={{ fontSize: 12, color: tmpl.mutedText, lineHeight: 1.7, margin: 0 }}>{data.summary}</p>
          </Section>
        )}
        {data.experience?.length > 0 && (
          <Section label="Experience" tmpl={tmpl}>
            {data.experience.map(e => (
              <div key={e.id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{e.role}</span>
                  <span style={{ fontSize: 11, color: tmpl.mutedText }}>{e.period}</span>
                </div>
                <p style={{ fontSize: 11, color: tmpl.accentText, margin: "0 0 6px", fontWeight: 500 }}>{e.company}</p>
                <ul style={{ paddingLeft: 14, margin: 0 }}>
                  {e.bullets?.filter(b => b.text).map(b => (
                    <li key={b.id} style={{ fontSize: 11, color: tmpl.mutedText, marginBottom: 3, lineHeight: 1.55 }}>{b.text}</li>
                  ))}
                </ul>
              </div>
            ))}
          </Section>
        )}
        {data.skills?.length > 0 && (
          <Section label="Skills" tmpl={tmpl}>
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
          </Section>
        )}
        {data.education?.length > 0 && (
          <Section label="Education" tmpl={tmpl}>
            {data.education.map(e => (
              <div key={e.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{e.school}</span>
                  <span style={{ fontSize: 11, color: tmpl.mutedText }}>{e.period}</span>
                </div>
                <p style={{ fontSize: 11, color: tmpl.mutedText, margin: 0 }}>{e.degree}{e.gpa ? ` · GPA: ${e.gpa}` : ""}</p>
              </div>
            ))}
          </Section>
        )}
        {data.projects?.length > 0 && (
          <Section label="Projects" tmpl={tmpl}>
            {data.projects.map(p => (
              <div key={p.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                  {p.link && <span style={{ fontSize: 10, color: tmpl.mutedText }}>{p.link}</span>}
                </div>
                <p style={{ fontSize: 11, color: tmpl.mutedText, margin: "2px 0 6px" }}>{p.desc}</p>
                {p.tags && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {p.tags.split(",").map(t => (
                      <span key={t} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: tmpl.tagBg, color: tmpl.tagText }}>{t.trim()}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}

/* ── Page ── */
export default function PublicResumePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ResumeData | null>(null);
  const [tmpl, setTmpl] = useState<TemplateStyle>(TEMPLATES[0]);
  const [label, setLabel] = useState("Resume");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/r/${id}`)
      .then(r => r.json())
      .then(json => {
        if (json.error) { setNotFound(true); return; }
        const { _templateId, ...resumeData } = json.data as ResumeData;
        setData(resumeData as ResumeData);
        setLabel(json.label || "Resume");
        const t = TEMPLATES.find(t => t.id === _templateId);
        if (t) setTmpl(t);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center gap-4 text-center px-6">
        <FileText className="w-10 h-10 text-white/20" />
        <p className="text-white/60 font-medium">Resume not found</p>
        <p className="text-white/30 text-sm">This link may be invalid or the resume was deleted.</p>
        <Link href="/" className="mt-2 px-4 py-2 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white/60 text-sm hover:bg-white/[0.1] transition-colors">
          Go to Folio.ai
        </Link>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          .resume-topbar { display: none !important; }
          .resume-shell  { padding: 0 !important; background: #fff !important; }
          .resume-card   { box-shadow: none !important; }
          @page { margin: 0; size: A4; }
        }
      `}</style>

      {/* Top bar */}
      <div className="resume-topbar fixed top-0 left-0 right-0 h-14 bg-[#050508]/95 backdrop-blur-xl border-b border-white/[0.05] flex items-center justify-between px-6 z-50">
        <Link href="/" className="flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Folio.ai</span>
        </Link>
        <span className="text-sm font-medium text-white/60 truncate mx-4 max-w-[200px]">{data.name || label}</span>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-[#060608] text-sm font-medium hover:bg-white/90 transition-colors flex-shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Download PDF</span>
        </button>
      </div>

      {/* Resume */}
      <div className="resume-shell pt-14 min-h-screen bg-gray-200 flex justify-center py-8">
        <div className="resume-card w-full max-w-[816px] shadow-2xl" style={{ background: tmpl.bg }}>
          <ResumeDoc data={data} tmpl={tmpl} />
        </div>
      </div>
    </>
  );
}
