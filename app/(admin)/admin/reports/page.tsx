"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Flag, Check, X, ExternalLink } from "lucide-react";

interface Report {
  id: string; targetType: string; targetId: string; reason: string; details: string | null;
  status: string; createdAt: string;
  reporter: { name: string | null; username: string | null; email: string | null } | null;
}

const REASON_COLORS: Record<string, string> = {
  spam: "bg-amber-100 text-amber-700", scam: "bg-orange-100 text-orange-700",
  abuse: "bg-red-100 text-red-700", illegal: "bg-red-200 text-red-800", other: "bg-gray-100 text-gray-600",
};

// Best-effort link to the reported content for the moderator to inspect.
function targetLink(t: Report): string | null {
  switch (t.targetType) {
    case "user": return `/u/${t.targetId}`;
    case "campaign": return `/admin/campaigns`;
    case "post": return `/community`;
    default: return null;
  }
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [tab, setTab] = useState<"open" | "all">("open");
  const [loading, setLoading] = useState(true);

  const load = useCallback((status: string) => {
    setLoading(true);
    fetch(`/api/admin/reports?status=${status}`)
      .then((r) => r.json())
      .then((d) => { setReports(d.reports ?? []); setOpenCount(d.openCount ?? 0); })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(tab); }, [load, tab]);

  const resolve = async (id: string, status: string) => {
    setReports((rs) => rs.filter((r) => r.id !== id || tab === "all"));
    if (tab === "all") setReports((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    setOpenCount((c) => Math.max(0, c - 1));
    await fetch("/api/admin/reports", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <Flag className="w-6 h-6 text-red-500" />
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        {openCount > 0 && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">{openCount} open</span>}
      </div>
      <p className="text-gray-500 text-sm mb-5">Review user-submitted reports and take action.</p>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-5">
        {(["open", "all"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 text-sm font-medium rounded-lg capitalize ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>{t}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : reports.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <Flag className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-900 font-semibold">{tab === "open" ? "No open reports" : "No reports"}</p>
          <p className="text-gray-400 text-sm">Reported content will show up here for review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const link = targetLink(r);
            return (
              <div key={r.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${REASON_COLORS[r.reason] ?? REASON_COLORS.other}`}>{r.reason}</span>
                      <span className="text-xs text-gray-500">on a <strong>{r.targetType}</strong></span>
                      {r.status !== "open" && <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">{r.status}</span>}
                    </div>
                    {r.details && <p className="text-sm text-gray-700 mt-2">{r.details}</p>}
                    <p className="text-xs text-gray-400 mt-2">
                      Reported by {r.reporter?.name ?? r.reporter?.email ?? "a user"} · {new Date(r.createdAt).toLocaleDateString()} · target <code className="bg-gray-100 px-1 rounded">{r.targetId.slice(0, 12)}</code>
                      {link && <> · <a href={link} target="_blank" className="text-[#2e9cfe] hover:underline inline-flex items-center gap-0.5">view <ExternalLink className="w-3 h-3" /></a></>}
                    </p>
                  </div>
                  {r.status === "open" && (
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => resolve(r.id, "actioned")} title="Mark actioned" className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100"><Check className="w-3.5 h-3.5" /> Actioned</button>
                      <button onClick={() => resolve(r.id, "dismissed")} title="Dismiss" className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-50 text-gray-600 text-xs font-medium hover:bg-gray-100"><X className="w-3.5 h-3.5" /> Dismiss</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
