"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelloraIcon } from "@/components/ui/logo";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [form, setForm] = useState({ password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500 text-sm mb-4">Invalid reset link. Please request a new one.</p>
        <Link href="/forgot-password"><Button variant="lime" className="w-full">Request new link</Button></Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Password updated!</h2>
        <p className="text-gray-500 text-sm">Redirecting you to sign in…</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Set new password</h1>
      <p className="text-gray-500 text-sm mb-8">Choose a strong password for your account.</p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showPw ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min. 8 characters"
              minLength={8}
              required
              className="w-full h-10 pl-10 pr-10 rounded-xl bg-white border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nexus-500 focus:border-transparent transition-all"
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showPw ? "text" : "password"}
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder="Repeat your password"
              required
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nexus-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
        <Button type="submit" variant="lime" className="w-full" loading={loading}>
          Update password
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(180deg,#0870b0 0%,#0f9fd8 18%,#1ab8ea 40%,#22c4ef 65%,#52d0f5 85%,#cef3fd 97%,#f0faff 100%)" }}
    >
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="relative w-full max-w-md px-4">
        <Link href="/login" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-8 drop-shadow transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl shadow-sky-900/20 border border-white/60 p-8">
          <div className="flex items-center gap-2 mb-8">
            <SelloraIcon size={32} />
            <span className="text-gray-900 font-bold text-xl">Sellora</span>
          </div>
          <Suspense fallback={<div className="h-48 animate-pulse bg-gray-50 rounded-xl" />}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
