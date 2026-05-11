"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Key,
  Trash2,
  Check,
  ChevronRight,
  Crown,
  GitBranch,
  Link2,
  LogOut,
} from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "integrations", label: "Integrations", icon: Globe },
  { id: "security", label: "Security", icon: Shield },
];

const INITIAL_INTEGRATIONS = [
  { name: "GitHub", icon: GitBranch, connected: true, desc: "Repos, stars, contribution graph" },
  { name: "LinkedIn", icon: Link2, connected: false, desc: "Experience, connections, endorsements" },
  { name: "Google", icon: Globe, connected: true, desc: "Sign-in and calendar sync" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [saved, setSaved] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState(INITIAL_INTEGRATIONS);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleSave = () => {
    setSaved(true);
    toast.success("Profile saved");
    setTimeout(() => setSaved(false), 2000);
  };

  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatar(url);
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

  const handleSignOut = () => {
    toast("Signing out…");
    setTimeout(() => router.push("/"), 800);
  };

  return (
    <div className="flex min-h-screen bg-[#050508]">
      <DashboardSidebar />

      <main className="flex-1 ml-[220px] min-h-screen">
        <div className="h-16 border-b border-white/[0.05] flex items-center px-8 bg-[#050508]/80 backdrop-blur-xl sticky top-0 z-30">
          <h1 className="font-semibold text-white">Settings</h1>
        </div>

        <div className="p-8 max-w-4xl">
          <div className="grid grid-cols-4 gap-6">
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
                <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition-all mt-4">
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="col-span-3 space-y-5">
              {activeTab === "profile" && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                  <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-6">
                    <h2 className="text-sm font-semibold mb-5">Profile Information</h2>
                    <div className="flex items-center gap-4 mb-6">
                      {avatar ? (
                        <img src={avatar} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover" />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.08] flex items-center justify-center text-xl font-bold text-white/60">JD</div>
                      )}
                      <div>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadPhoto} />
                        <button onClick={() => fileInputRef.current?.click()} className="text-sm text-white/55 hover:text-white/75 transition-colors">Upload photo</button>
                        <p className="text-xs text-white/35 mt-0.5">JPG, PNG up to 2MB</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "Full Name", value: "John Doe" },
                        { label: "Job Title", value: "Software Engineer" },
                        { label: "Email", value: "john@example.com" },
                        { label: "Location", value: "San Francisco, CA" },
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

                  <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-6">
                    <h2 className="text-sm font-semibold mb-5">Subscription</h2>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                      <div className="flex items-center gap-3">
                        <Crown className="w-5 h-5 text-amber-400" />
                        <div>
                          <div className="text-sm font-medium text-white">Free Plan</div>
                          <div className="text-xs text-white/35">3/3 resumes · 1/1 portfolio</div>
                        </div>
                      </div>
                      <Link href="/pricing" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-[#060608] text-sm font-medium hover:bg-white/90 transition-colors">
                        Upgrade to Pro
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
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
