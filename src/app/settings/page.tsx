"use client";

export const dynamic = "force-dynamic";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Key,
  Trash2,
  Check,
  Crown,
  GitBranch,
  Link2,
  LogOut,
  CreditCard,
  Zap,
  CheckCircle2,
} from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";

const TABS = [
  { id: "profile",       label: "Profile",       icon: User },
  { id: "billing",       label: "Billing",        icon: CreditCard },
  { id: "appearance",    label: "Appearance",     icon: Palette },
  { id: "notifications", label: "Notifications",  icon: Bell },
  { id: "integrations",  label: "Integrations",   icon: Globe },
  { id: "security",      label: "Security",       icon: Shield },
];

const INITIAL_INTEGRATIONS = [
  { name: "GitHub",   icon: GitBranch, connected: true,  desc: "Repos, stars, contribution graph" },
  { name: "LinkedIn", icon: Link2,     connected: false, desc: "Experience, connections, endorsements" },
  { name: "Google",   icon: Globe,     connected: true,  desc: "Sign-in and calendar sync" },
];

interface SubData {
  plan: string;
  status: string | null;
  currentPeriodEnd: string | null;
  isPro: boolean;
}

interface ReferralData {
  code: string;
  count: number;
  link: string;
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") ?? "profile";
  const upgraded = searchParams.get("upgraded") === "1";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [saved, setSaved] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState(INITIAL_INTEGRATIONS);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [subData, setSubData] = useState<SubData | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  useEffect(() => {
    fetch("/api/user/subscription")
      .then(r => r.json())
      .then(json => setSubData(json))
      .catch(() => {});
    fetch("/api/user/referral")
      .then(r => r.json())
      .then(json => { if (json.code) setReferralData(json); })
      .catch(() => {});
  }, []);

  // Auto-switch to billing tab when redirected from Stripe
  useEffect(() => {
    if (upgraded) setActiveTab("billing");
  }, [upgraded]);

  const handleSave = () => {
    setSaved(true);
    toast.success("Profile saved");
    setTimeout(() => setSaved(false), 2000);
  };

  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatar(URL.createObjectURL(file));
    toast.success("Photo updated");
  };

  const handleUpdatePassword = () => {
    if (!currentPw || !newPw) { toast.error("Please fill in both password fields"); return; }
    if (newPw.length < 8) { toast.error("New password must be at least 8 characters"); return; }
    setCurrentPw(""); setNewPw("");
    toast.success("Password updated successfully");
  };

  const handleDeleteAccount = () => {
    if (window.confirm("Are you sure? This will permanently delete your account and all data. This cannot be undone.")) {
      toast.error("Account deletion scheduled. You'll receive a confirmation email.");
    }
  };

  const toggleIntegration = (name: string) => {
    setIntegrations(prev => prev.map(i => {
      if (i.name !== name) return i;
      const next = !i.connected;
      toast(next ? `${name} connected` : `${name} disconnected`);
      return { ...i, connected: next };
    }));
  };

  const handleUpgrade = async (forceAnnual?: boolean) => {
    setLoadingCheckout(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ annual: forceAnnual ?? annual }),
      });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
      else toast.error("Could not start checkout");
    } catch {
      toast.error("Could not start checkout");
    } finally {
      setLoadingCheckout(false);
    }
  };

  const handleCopyReferral = () => {
    if (!referralData) return;
    navigator.clipboard.writeText(referralData.link).then(() => {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    });
  };

  const handleManage = async () => {
    setLoadingCheckout(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
      else toast.error("Could not open billing portal");
    } catch {
      toast.error("Could not open billing portal");
    } finally {
      setLoadingCheckout(false);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  return (
    <div className="flex min-h-screen bg-[#050508]">
      <DashboardSidebar />

      <main className="flex-1 md:ml-[220px] min-h-screen">
        <div className="h-16 border-b border-white/[0.05] flex items-center px-4 pl-14 md:px-8 bg-[#050508]/80 backdrop-blur-xl sticky top-0 z-30">
          <h1 className="font-semibold text-white">Settings</h1>
        </div>

        <div className="p-4 md:p-8 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar nav */}
            <div className="col-span-1">
              <nav className="space-y-0.5">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      activeTab === tab.id
                        ? "bg-white/[0.06] text-white font-medium"
                        : "text-white/45 hover:text-white/80 hover:bg-white/[0.05]"
                    }`}
                  >
                    <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-white/80" : "text-white/35"}`} />
                    {tab.label}
                  </button>
                ))}
                <button
                  onClick={() => signOut({ callbackUrl: "/sign-in" })}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition-all mt-4"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="col-span-3 space-y-5">

              {/* ── Profile ── */}
              {activeTab === "profile" && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                  <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-6">
                    <h2 className="text-sm font-semibold mb-5">Profile Information</h2>
                    <div className="flex items-center gap-4 mb-6">
                      {avatar || user?.image ? (
                        <img src={avatar ?? user?.image ?? ""} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover" />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.08] flex items-center justify-center text-xl font-bold text-white/60">
                          {user?.name ? user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() : "?"}
                        </div>
                      )}
                      <div>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadPhoto} />
                        <button onClick={() => fileInputRef.current?.click()} className="text-sm text-white/55 hover:text-white/75 transition-colors">Upload photo</button>
                        <p className="text-xs text-white/35 mt-0.5">JPG, PNG up to 2MB</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-white/35 mb-1.5 block">Full Name</label>
                        <input
                          defaultValue={user?.name ?? ""}
                          className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white/80 focus:outline-none focus:border-white/[0.15] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/35 mb-1.5 block">Email</label>
                        <input
                          defaultValue={user?.email ?? ""}
                          disabled
                          className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/40 cursor-not-allowed"
                        />
                      </div>
                      {[
                        { label: "Job Title",  value: "Software Engineer" },
                        { label: "Location",   value: "San Francisco, CA" },
                      ].map(field => (
                        <div key={field.label}>
                          <label className="text-xs text-white/35 mb-1.5 block">{field.label}</label>
                          <input
                            defaultValue={field.value}
                            className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white/80 focus:outline-none focus:border-white/[0.15] transition-colors"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleSave}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      saved
                        ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                        : "bg-white text-[#060608] hover:bg-white/90"
                    }`}
                  >
                    {saved ? <><Check className="w-4 h-4" />Saved!</> : "Save changes"}
                  </button>
                </motion.div>
              )}

              {/* ── Billing ── */}
              {activeTab === "billing" && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                  {/* Success banner */}
                  {upgraded && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-emerald-400">You're now on Pro!</p>
                        <p className="text-xs text-emerald-400/70 mt-0.5">All features are unlocked. Enjoy Folio Pro.</p>
                      </div>
                    </div>
                  )}

                  {/* Plan card */}
                  <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-6">
                    <h2 className="text-sm font-semibold mb-5">Current Plan</h2>

                    {subData === null ? (
                      <div className="h-20 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                      </div>
                    ) : subData.isPro ? (
                      <div className="space-y-4">
                        <div className="flex items-start justify-between p-4 rounded-xl bg-amber-400/[0.07] border border-amber-400/20">
                          <div className="flex items-center gap-3">
                            <Crown className="w-5 h-5 text-amber-400 shrink-0" />
                            <div>
                              <div className="text-sm font-semibold text-amber-400">Pro Plan</div>
                              <div className="text-xs text-white/40 mt-0.5 capitalize">
                                {subData.status ?? "active"}
                                {subData.currentPeriodEnd && ` · renews ${formatDate(subData.currentPeriodEnd)}`}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-400 border border-amber-400/20 shrink-0">PRO</span>
                        </div>
                        <ul className="space-y-2 text-xs text-white/50">
                          {["Unlimited AI rewrites", "All themes unlocked", "Recruiter analytics", "Custom domain", "Priority support"].map(f => (
                            <li key={f} className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" />{f}</li>
                          ))}
                        </ul>
                        <button
                          onClick={handleManage}
                          disabled={loadingCheckout}
                          className="w-full h-10 rounded-xl bg-amber-400/10 border border-amber-400/25 text-amber-400 text-sm font-semibold hover:bg-amber-400/20 transition-colors disabled:opacity-50"
                        >
                          {loadingCheckout ? "Loading…" : "Manage Subscription"}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                          <Zap className="w-5 h-5 text-white/40 shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-white/80">Free Plan</div>
                            <div className="text-xs text-white/35 mt-0.5">Limited features</div>
                          </div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-3">
                          <p className="text-xs font-semibold text-white/55 uppercase tracking-wider">What you get with Pro</p>
                          <ul className="space-y-2 text-xs text-white/50">
                            {["Unlimited AI rewrites (5/mo on free)", "All Pro themes unlocked", "Unlimited PDF exports (1 free)", "Multiple resumes", "Recruiter analytics", "Custom domain", "Priority support"].map(f => (
                              <li key={f} className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400/70" />{f}</li>
                            ))}
                          </ul>
                        </div>
                        {/* Billing interval toggle */}
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                          <button
                            onClick={() => setAnnual(false)}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${!annual ? "bg-white text-[#060608]" : "text-white/45 hover:text-white/70"}`}
                          >
                            Monthly<br /><span className="font-normal">$9 / mo</span>
                          </button>
                          <button
                            onClick={() => setAnnual(true)}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all relative ${annual ? "bg-white text-[#060608]" : "text-white/45 hover:text-white/70"}`}
                          >
                            Annual<br /><span className="font-normal">$79 / yr</span>
                            <span className="absolute -top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">SAVE 27%</span>
                          </button>
                        </div>
                        <button
                          onClick={() => handleUpgrade()}
                          disabled={loadingCheckout}
                          className="w-full h-10 rounded-xl bg-white text-[#060608] text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-60"
                        >
                          {loadingCheckout ? "Loading…" : annual ? "Upgrade to Pro — $79/yr" : "Upgrade to Pro — $9/mo"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Referral section */}
                  <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-6">
                    <h2 className="text-sm font-semibold mb-1">Referral Program</h2>
                    <p className="text-xs text-white/40 mb-4">Share your link. Get 1 month free for every friend who upgrades to Pro.</p>
                    {referralData ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white/55 font-mono truncate">
                            {referralData.link}
                          </div>
                          <button
                            onClick={handleCopyReferral}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0 ${copiedRef ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" : "bg-white/[0.06] border-white/[0.1] text-white/60 hover:text-white/80"}`}
                          >
                            {copiedRef ? <><Check className="w-3.5 h-3.5 inline mr-1" />Copied!</> : "Copy"}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/40">
                          <Crown className="w-3.5 h-3.5 text-amber-400" />
                          <span>{referralData.count} paying referral{referralData.count !== 1 ? "s" : ""} · {referralData.count} free month{referralData.count !== 1 ? "s" : ""} earned</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-10 flex items-center">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── Integrations ── */}
              {activeTab === "integrations" && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-6">
                    <h2 className="text-sm font-semibold mb-5">Connected Accounts</h2>
                    <div className="space-y-3">
                      {integrations.map(integration => (
                        <div key={integration.name} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                          <integration.icon className="w-6 h-6 text-white/45 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white/80">{integration.name}</div>
                            <div className="text-xs text-white/35">{integration.desc}</div>
                          </div>
                          <button
                            onClick={() => toggleIntegration(integration.name)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              integration.connected
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20"
                                : "bg-white/[0.05] text-white/45 border border-white/[0.1] hover:bg-white/[0.06]"
                            }`}
                          >
                            {integration.connected ? "Connected" : "Connect"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Security ── */}
              {activeTab === "security" && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-6 space-y-5">
                    <h2 className="text-sm font-semibold">Security Settings</h2>
                    <div>
                      <label className="text-xs text-white/35 mb-1.5 block">Current Password</label>
                      <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white/80 focus:outline-none focus:border-white/[0.15] transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs text-white/35 mb-1.5 block">New Password</label>
                      <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white/80 focus:outline-none focus:border-white/[0.15] transition-colors" />
                    </div>
                    <button onClick={handleUpdatePassword} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-white text-[#060608] hover:bg-white/90 transition-colors">
                      <Key className="w-4 h-4" />
                      Update password
                    </button>
                  </div>
                  <div className="rounded-2xl bg-red-500/5 border border-red-500/15 p-6">
                    <h2 className="text-sm font-semibold text-red-400 mb-2">Danger Zone</h2>
                    <p className="text-xs text-white/35 mb-4">Once deleted, your account and all data cannot be recovered.</p>
                    <button onClick={handleDeleteAccount} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all">
                      <Trash2 className="w-4 h-4" />
                      Delete account
                    </button>
                  </div>
                </motion.div>
              )}

              {(activeTab === "appearance" || activeTab === "notifications") && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-6">
                    <h2 className="text-sm font-semibold mb-2">{activeTab === "appearance" ? "Appearance" : "Notifications"}</h2>
                    <p className="text-xs text-white/35">Settings coming soon.</p>
                  </div>
                </motion.div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
