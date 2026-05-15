"use client";

export const dynamic = "force-dynamic";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      document.cookie = `folio_ref=${encodeURIComponent(ref)}; path=/; max-age=604800; SameSite=Lax`;
    }
  }, [searchParams]);

  const handleGoogle = async () => {
    setLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#060608", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px", backgroundImage: "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "28px 28px" }}>
      {/* Subtle teal glow */}
      <div style={{ position: "fixed", top: "40%", left: "50%", transform: "translate(-50%,-50%)", width: 500, height: 400, background: "radial-gradient(ellipse at center, rgba(52,211,153,0.05) 0%, transparent 65%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", width: "100%", maxWidth: 360 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", marginBottom: 16 }}>
            <img src="/logo.svg" alt="Logo" style={{ width: 28, height: 28 }} className="invert opacity-75" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.025em", margin: 0 }}>Folio.ai</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.32)", marginTop: 6 }}>Your modern career platform</p>
        </div>

        {/* Card */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "32px 28px", backdropFilter: "blur(20px)" }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: "#fff", marginBottom: 6, letterSpacing: "-0.02em" }}>Welcome back</h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", marginBottom: 28, lineHeight: 1.65 }}>
            Sign in to access your resumes, portfolio, and AI tools.
          </p>

          <button
            onClick={handleGoogle}
            disabled={loading}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "12px 20px", borderRadius: 12, background: "#fff", color: "#060608", fontSize: 14, fontWeight: 600, border: "none", cursor: loading ? "wait" : "pointer", opacity: loading ? 0.6 : 1, transition: "all 0.15s", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}
          >
            {loading ? (
              <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #ccc", borderTopColor: "#555", animation: "spin 0.7s linear infinite" }} />
            ) : (
              <svg style={{ width: 18, height: 18, flexShrink: 0 }} viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            {loading ? "Signing in…" : "Continue with Google"}
          </button>

          <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)", lineHeight: 1.65 }}>
              By signing in you agree to our{" "}
              <span style={{ color: "rgba(255,255,255,0.38)", cursor: "pointer" }}>Terms</span>
              {" "}and{" "}
              <span style={{ color: "rgba(255,255,255,0.38)", cursor: "pointer" }}>Privacy Policy</span>.
            </p>
          </div>
        </div>

        {/* Features teaser */}
        <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {[
            { label: "AI Resume Builder",   icon: "📄" },
            { label: "Portfolio Generator", icon: "🌐" },
            { label: "Recruiter Review",    icon: "✨" },
          ].map(f => (
            <div key={f.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 8px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ fontSize: 18 }}>{f.icon}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", textAlign: "center", lineHeight: 1.35 }}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
