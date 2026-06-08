"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Mail, Lock, User, Share2, Eye, EyeOff, ArrowLeft, Check } from "lucide-react";
import { SelloraIcon } from "@/components/ui/logo";

const roles = [
  { id: "creator", label: "Creator", desc: "Artists, writers, makers", emoji: "Art" },
  { id: "developer", label: "Developer", desc: "Builders & engineers", emoji: "Dev" },
  { id: "entrepreneur", label: "Entrepreneur", desc: "Startups & founders", emoji: "Biz" },
  { id: "educator", label: "Educator", desc: "Teachers & coaches", emoji: "Edu" },
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", website: "" });

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleStep2 = async () => {
    if (!selectedRole) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password, role: selectedRole, website: form.website }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Registration failed. Please try again.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Account created but sign-in failed. Please log in manually.");
      setLoading(false);
      return;
    }

    router.push("/onboarding");
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0870b0 0%, #0f9fd8 18%, #1ab8ea 40%, #22c4ef 65%, #52d0f5 85%, #cef3fd 97%, #f0faff 100%)" }}>
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-white/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-white/15 rounded-full blur-[100px]" />

      <div className="relative w-full max-w-md px-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-8 drop-shadow transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl shadow-sky-900/20 border border-white/60 p-8">
          {/* Logo & progress */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <SelloraIcon size={32} />
              <span className="text-gray-900 font-bold text-xl">Sellora</span>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2].map((s) => (
                <div
                  key={s}
                  className={`w-8 h-1.5 rounded-full transition-all ${
                    s <= step ? "bg-nexus-500" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>

          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
              <p className="text-gray-500 text-sm mb-8">
                Join 50,000+ creators. Free forever.
              </p>

              {/* OAuth */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => signIn("google", { redirectTo: "/onboarding" })}
                  className="flex items-center justify-center gap-2 h-10 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all text-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                <button
                  onClick={() => signIn("github", { redirectTo: "/onboarding" })}
                  className="flex items-center justify-center gap-2 h-10 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all text-sm"
                >
                  <Share2 className="w-4 h-4" />
                  GitHub
                </button>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-gray-400 text-xs">or with email</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <form onSubmit={handleStep1} className="space-y-4">
                {/* Honeypot — hidden from humans, catches bots that fill every field */}
                <input
                  type="text" tabIndex={-1} autoComplete="off" aria-hidden="true"
                  value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
                  style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your full name"
                      required
                      className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nexus-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      required
                      className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nexus-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Min 8 characters"
                      required
                      minLength={8}
                      className="w-full h-10 pl-10 pr-10 rounded-xl bg-white border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nexus-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" variant="lime" className="w-full">
                  Continue
                </Button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">What best describes you?</h1>
              <p className="text-gray-500 text-sm mb-6">
                This helps us personalize your experience.
              </p>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-6">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`relative p-4 rounded-xl border text-left transition-all ${
                      selectedRole === role.id
                        ? "border-nexus-500 bg-nexus-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-nexus-300 hover:bg-sky-50"
                    }`}
                  >
                    {selectedRole === role.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-nexus-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-3 text-sm font-bold">{role.emoji}</div>
                    <div className="text-gray-900 text-sm font-semibold">{role.label}</div>
                    <div className="text-gray-400 text-xs mt-0.5">{role.desc}</div>
                  </button>
                ))}
              </div>

              <Button
                onClick={handleStep2}
                variant="lime"
                className="w-full"
                loading={loading}
                disabled={!selectedRole}
              >
                Create My Account
              </Button>

              <button
                onClick={() => setStep(1)}
                className="w-full flex items-center justify-center gap-1.5 text-gray-400 hover:text-gray-700 text-sm mt-4 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            </>
          )}

          {step === 1 && (
            <p className="text-center text-gray-400 text-xs mt-6 leading-relaxed">
              By signing up, you agree to our{" "}
              <Link href="/terms" className="text-nexus-600 hover:text-nexus-700">Terms</Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-nexus-600 hover:text-nexus-700">Privacy Policy</Link>.
            </p>
          )}

          <p className="text-center text-gray-500 text-sm mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-nexus-600 hover:text-nexus-700 transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
