"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelloraIcon } from "@/components/ui/logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Something went wrong");
      }
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

          {sent ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
              <p className="text-gray-500 text-sm mb-6">
                We sent a password reset link to <strong>{email}</strong>. It expires in 1 hour.
              </p>
              <p className="text-gray-400 text-xs mb-6">
                Didn't get it? Check your spam folder, or{" "}
                <button onClick={() => setSent(false)} className="text-nexus-600 hover:underline">try again</button>.
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full border-gray-200">Return to sign in</Button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Forgot password?</h1>
              <p className="text-gray-500 text-sm mb-8">Enter your email and we'll send you a reset link.</p>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nexus-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
                <Button type="submit" variant="lime" className="w-full" loading={loading}>
                  Send reset link
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
