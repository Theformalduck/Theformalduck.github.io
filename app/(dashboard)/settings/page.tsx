"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession, signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User, Bell, CreditCard, Shield, Globe, AtSign, Share2, Download,
  ExternalLink, Check, Loader2, AlertCircle, Trash2, CheckCircle2,
} from "lucide-react";
import { MediaUpload } from "@/components/ui/media-upload";
import { getInitials } from "@/lib/utils";

function PaymentsContent() {
  const searchParams = useSearchParams();
  const justConnected = searchParams.get("stripe") === "connected";

  const [status, setStatus] = useState<{ connected: boolean; onboardingStarted: boolean; detailsSubmitted: boolean; stripeConfigured: boolean } | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [working, setWorking] = useState(false);
  const [connectError, setConnectError] = useState("");

  const loadStatus = () => {
    fetch("/api/stripe/account")
      .then((r) => r.json())
      .then((d) => setStatus(d))
      .catch(() => {})
      .finally(() => setLoadingStatus(false));
  };
  useEffect(loadStatus, []);

  // Start / continue onboarding, or open the connected Stripe dashboard.
  const act = async (action: "onboard" | "dashboard" | "disconnect") => {
    setWorking(true);
    setConnectError("");
    try {
      const res = await fetch("/api/stripe/account", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      if (action === "disconnect") { loadStatus(); return; }
      if (data.url) { window.location.href = data.url; return; }
      loadStatus();
    } catch (err: any) {
      setConnectError(err.message);
    } finally {
      setWorking(false);
    }
  };

  if (loadingStatus) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center justify-center h-40">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  const connected = !!status?.connected;
  const incomplete = !!status?.onboardingStarted && !connected;

  return (
    <div className="space-y-4">
      {justConnected && connected && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Stripe connected! You can now receive payments from sales.
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-gray-900 font-semibold">Stripe Payments</h3>
            <p className="text-gray-400 text-xs mt-0.5">Connect Stripe to receive payments from product sales</p>
          </div>
          {connected && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-medium border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" />
              Active
            </span>
          )}
        </div>

        {!status?.stripeConfigured && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 mb-4 text-amber-700 text-xs">
            Stripe isn&apos;t configured on this server yet. Add <code className="bg-amber-100 px-1 rounded">STRIPE_SECRET_KEY</code> to enable checkout.
          </div>
        )}

        {connected ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-gray-700 text-sm font-medium">Your Stripe account is connected and ready.</span>
              </div>
            </div>
            <p className="text-gray-400 text-xs">Payments from your sales are deposited to your Stripe account (minus Stripe and platform fees).</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => act("dashboard")} disabled={working} className="border-gray-200 text-gray-600">
                {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />} Stripe dashboard
              </Button>
              <Button variant="outline" size="sm" onClick={() => act("disconnect")} disabled={working} className="border-gray-200 text-red-500">
                <Trash2 className="w-4 h-4" /> Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
              <p className="text-gray-600 text-sm mb-2">Connect your Stripe to:</p>
              <ul className="space-y-1.5">
                {["Receive payments from product sales directly", "Let buyers pay with card, Apple Pay & more", "Get paid out automatically by Stripe"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-gray-500 text-xs">
                    <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {incomplete && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-700 text-xs">
                Your Stripe onboarding isn&apos;t finished yet. Continue to start accepting payments.
              </div>
            )}
            <Button variant="lime" onClick={() => act("onboard")} disabled={working || !status?.stripeConfigured}>
              {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              {incomplete ? "Continue onboarding" : "Connect Stripe"}
            </Button>
          </div>
        )}

        {connectError && (
          <div className="flex items-center gap-2 mt-3 text-red-500 text-xs">
            <AlertCircle className="w-3.5 h-3.5" />
            {connectError}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-nexus-500 transition-all ${className}`}
      {...props}
    />
  );
}

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ name: "", username: "", email: "", bio: "", image: "" });
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");

  const [passwords, setPasswords] = useState({ current: "", newPw: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwStatus, setPwStatus] = useState<"idle" | "saved" | "error">("idle");
  const [pwError, setPwError] = useState("");

  const [notifSettings, setNotifSettings] = useState({
    newBackers: true,
    milestones: true,
    newOrders: true,
    newFollowers: false,
    comments: true,
    platformUpdates: false,
  });
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((u) => {
        if (u?.id) {
          setProfile({
            name: u.name ?? "",
            username: u.username ?? "",
            email: u.email ?? "",
            bio: u.bio ?? "",
            image: u.image ?? "",
          });
          if (u.notificationPrefs && typeof u.notificationPrefs === "object") {
            setNotifSettings((prev) => ({ ...prev, ...u.notificationPrefs }));
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveStatus("idle");
    setSaveError("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profile.name, username: profile.username, bio: profile.bio, image: profile.image }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setSaveStatus("saved");
      await updateSession();
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err: any) {
      setSaveStatus("error");
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.newPw !== passwords.confirm) {
      setPwStatus("error");
      setPwError("Passwords do not match");
      return;
    }
    setPwSaving(true);
    setPwStatus("idle");
    setPwError("");
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update password");
      setPwStatus("saved");
      setPasswords({ current: "", newPw: "", confirm: "" });
      setTimeout(() => setPwStatus("idle"), 3000);
    } catch (err: any) {
      setPwStatus("error");
      setPwError(err.message);
    } finally {
      setPwSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setNotifSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationPrefs: notifSettings }),
      });
      if (!res.ok) throw new Error("save failed");
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 2500);
    } catch {
      // surface a lightweight error inline via the saved flag staying off
    } finally {
      setNotifSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError("");
    setDeleting(true);
    try {
      const res = await fetch("/api/user/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: deleteConfirm, password: deletePassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to delete account");
      // Account gone — end the session and leave.
      await signOut({ callbackUrl: "/" });
    } catch (err: any) {
      setDeleteError(err.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const initials = getInitials(profile.name || profile.email || "?");
  const initialTab = typeof window !== "undefined"
    ? (new URLSearchParams(window.location.search).get("tab") ?? "profile")
    : "profile";
  const validTabs = ["profile", "notifications", "security", "payments"];
  const defaultTab = validTabs.includes(initialTab) ? initialTab : "profile";

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your account preferences</p>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="bg-white border border-gray-200 mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile" className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-gray-900 font-semibold mb-5">Personal Information</h3>

            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative group flex-shrink-0">
                {profile.image ? (
                  <img src={profile.image} alt={profile.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-gray-100" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-nexus-500 flex items-center justify-center text-white text-2xl font-bold">
                    {initials}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-gray-700 text-sm font-medium mb-1">{profile.name || "Your Name"}</p>
                <p className="text-gray-400 text-xs mb-2">{profile.email}</p>
                <MediaUpload
                  value={profile.image}
                  onChange={(url) => setProfile({ ...profile, image: url })}
                  accept="image"
                  compact
                  allowYoutube={false}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="Name">
                <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Your full name" />
              </Field>
              <Field label="Username">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                  <Input className="pl-7" value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") })} placeholder="yourhandle" />
                </div>
              </Field>
              <Field label="Email">
                <Input value={profile.email} disabled className="opacity-60 cursor-not-allowed" />
              </Field>
            </div>

            <Field label="Bio">
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                rows={3}
                placeholder="Tell people about yourself..."
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-nexus-500 transition-all resize-none"
              />
            </Field>
          </div>

          {saveStatus === "error" && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" />
              {saveError}
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="lime" onClick={handleSaveProfile} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveStatus === "saved" ? <Check className="w-4 h-4" /> : null}
              {saveStatus === "saved" ? "Saved!" : "Save Changes"}
            </Button>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-gray-900 font-semibold mb-5">Email Notifications</h3>
            <div className="space-y-4">
              {[
                { key: "newBackers", label: "New backers", desc: "When someone backs your campaign" },
                { key: "milestones", label: "Campaign milestones", desc: "50%, 75%, 100% funded" },
                { key: "newOrders", label: "New orders", desc: "When a customer places an order" },
                { key: "newFollowers", label: "New followers", desc: "When someone follows you" },
                { key: "comments", label: "Comments", desc: "On your posts and campaigns" },
                { key: "platformUpdates", label: "Platform updates", desc: "New features and announcements" },
              ].map(({ key, label, desc }) => {
                const enabled = notifSettings[key as keyof typeof notifSettings];
                return (
                  <div key={key} className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-gray-700 text-sm font-medium">{label}</div>
                      <div className="text-gray-400 text-xs">{desc}</div>
                    </div>
                    <button
                      onClick={() => setNotifSettings((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                      className={`relative w-10 h-5 rounded-full transition-all ${enabled ? "bg-nexus-600" : "bg-gray-200"}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${enabled ? "left-[1.4rem]" : "left-0.5"}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="lime" onClick={handleSaveNotifications} disabled={notifSaving}>
              {notifSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : notifSaved ? <Check className="w-4 h-4" /> : null}
              {notifSaved ? "Saved!" : "Save Preferences"}
            </Button>
          </div>
        </TabsContent>

        {/* Payments */}
        <TabsContent value="payments">
          <Suspense fallback={
            <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center justify-center h-40">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          }>
            <PaymentsContent />
          </Suspense>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-gray-900 font-semibold mb-5">Change Password</h3>
            <div className="space-y-3 max-w-sm">
              <Field label="Current Password">
                <Input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} placeholder="••••••••" />
              </Field>
              <Field label="New Password">
                <Input type="password" value={passwords.newPw} onChange={(e) => setPasswords({ ...passwords, newPw: e.target.value })} placeholder="Min. 8 characters" />
              </Field>
              <Field label="Confirm New Password">
                <Input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} placeholder="••••••••" />
              </Field>
              {pwStatus === "error" && (
                <div className="flex items-center gap-2 text-red-500 text-xs">
                  <AlertCircle className="w-3.5 h-3.5" />{pwError}
                </div>
              )}
              {pwStatus === "saved" && (
                <div className="flex items-center gap-2 text-emerald-500 text-xs">
                  <Check className="w-3.5 h-3.5" />Password updated successfully!
                </div>
              )}
              <Button variant="lime" size="sm" onClick={handleChangePassword} disabled={pwSaving || !passwords.newPw}>
                {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Update Password
              </Button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-gray-900 font-semibold mb-2">Your data</h3>
            <p className="text-gray-500 text-sm mb-4">
              Download a copy of the personal data we hold for your account — your profile, store,
              products, campaigns, orders, and more — as a JSON file. Passwords and tokens are never
              included.
            </p>
            <Button asChild variant="outline" size="sm">
              <a href="/api/user/export">
                <Download className="w-4 h-4" />
                Download my data
              </a>
            </Button>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <h3 className="text-red-600 font-semibold mb-2">Danger Zone</h3>
            <p className="text-gray-500 text-sm mb-4">
              Deleting your account permanently removes your profile, portfolio, store, products,
              campaigns, posts and follows. Orders you placed are kept for the sellers but anonymized.
              This cannot be undone.
            </p>
            <div className="space-y-3 max-w-sm">
              <Field label={'Type "DELETE" to confirm'}>
                <Input value={deleteConfirm} onChange={(e) => { setDeleteConfirm(e.target.value); setDeleteError(""); }} placeholder="DELETE" />
              </Field>
              <Field label="Your password">
                <Input type="password" value={deletePassword} onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(""); }} placeholder="Enter your password" />
              </Field>
              {deleteError && (
                <div className="flex items-center gap-2 text-red-500 text-xs">
                  <AlertCircle className="w-3.5 h-3.5" />{deleteError}
                </div>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirm.trim().toUpperCase() !== "DELETE"}
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? "Deleting…" : "Delete Account"}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
