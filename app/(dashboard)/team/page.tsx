"use client";

import { useState, useEffect } from "react";
import { Loader2, UserPlus, Trash2, Mail, Check, ShieldCheck } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { ASSIGNABLE_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, type Role } from "@/lib/team-roles";

interface Member {
  id: string; email: string; role: string; status: string;
  invitedAt: string; acceptedAt: string | null;
  member: { name: string | null; image: string | null; username: string | null } | null;
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("STAFF");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const load = () => {
    fetch("/api/team").then((r) => r.json()).then((d) => setMembers(d.members ?? [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const invite = async () => {
    if (!email.trim()) return;
    setInviting(true); setError(""); setSent(false);
    try {
      const res = await fetch("/api/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, role }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to invite");
      setEmail(""); setSent(true); setTimeout(() => setSent(false), 2500);
      load();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to invite"); }
    finally { setInviting(false); }
  };

  const changeRole = async (id: string, newRole: string) => {
    setMembers((m) => m.map((x) => (x.id === id ? { ...x, role: newRole } : x)));
    await fetch("/api/team", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, role: newRole }) });
  };

  const remove = async (id: string) => {
    setMembers((m) => m.filter((x) => x.id !== id));
    await fetch(`/api/team?id=${id}`, { method: "DELETE" });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">Team</h1>
      <p className="text-gray-500 text-sm mt-0.5 mb-6">Invite teammates to help run your store, each with a role that controls what they can do.</p>

      {/* Invite */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><UserPlus className="w-4 h-4 text-[#2e9cfe]" /> Invite a teammate</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }} placeholder="teammate@email.com"
            className="flex-1 h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-[#2e9cfe]" />
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-[#2e9cfe]">
            {ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <button onClick={invite} disabled={inviting || !email.trim()}
            className="h-10 px-4 rounded-xl bg-[#2e9cfe] text-white text-sm font-semibold hover:bg-[#1a8cf0] disabled:opacity-50 flex items-center justify-center gap-1.5">
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : sent ? <Check className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
            {sent ? "Sent" : "Invite"}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">{ROLE_DESCRIPTIONS[role]}</p>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>

      {/* Members */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 text-sm font-semibold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-gray-400" /> Members
        </div>
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
        ) : members.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-400">No teammates yet. Invite someone above.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                {m.member?.image
                  ? <img src={m.member.image} alt="" className="w-9 h-9 rounded-full object-cover" />
                  : <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold">{getInitials(m.member?.name ?? m.email)}</div>}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{m.member?.name ?? m.email}</div>
                  <div className="text-xs text-gray-400 truncate">{m.email}</div>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${m.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                  {m.status === "active" ? "Active" : "Pending"}
                </span>
                <select value={m.role} onChange={(e) => changeRole(m.id, e.target.value)} className="h-8 px-2 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-700 focus:outline-none">
                  {ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
                <button onClick={() => remove(m.id)} className="p-1.5 text-gray-300 hover:text-red-500" title="Remove"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
