"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Layout, Rocket, ShoppingBag } from "lucide-react";
import { SelloraIcon } from "@/components/ui/logo";

const steps = [
  {
    id: "profile",
    title: "Set up your profile",
    description: "Tell the world who you are.",
    icon: Sparkles,
  },
  {
    id: "goals",
    title: "Choose your goals",
    description: "What do you want to achieve?",
    icon: Sparkles,
  },
  {
    id: "first-action",
    title: "Pick your first action",
    description: "Where do you want to start?",
    icon: Rocket,
  },
];

const goals = [
  { id: "portfolio", label: "Build a portfolio", icon: Layout },
  { id: "campaign", label: "Launch a campaign", icon: Rocket },
  { id: "store", label: "Open a store", icon: ShoppingBag },
  { id: "audience", label: "Grow an audience", icon: Sparkles },
];

const firstActions = [
  { id: "portfolio", title: "Build my portfolio",   desc: "Create a stunning website in minutes", icon: Layout,    href: "/portfolio" },
  { id: "campaign",  title: "Launch a campaign",    desc: "Raise funds for your next project",   icon: Rocket,    href: "/campaigns/new" },
  { id: "store",     title: "Set up my store",      desc: "Start selling products today",         icon: ShoppingBag, href: "/store" },
  { id: "explore",   title: "Explore the platform", desc: "See everything Sellora can do",        icon: Sparkles,  href: "/dashboard" },
];

export default function OnboardingClient({ initialUsername = "" }: { initialUsername?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [profile, setProfile] = useState({ username: initialUsername, bio: "" });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleProfileSave = async () => {
    if (!profile.username) return;
    setProfileLoading(true);
    setProfileError(null);

    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: profile.username, bio: profile.bio }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setProfileError(data.error ?? "Failed to save profile.");
      setProfileLoading(false);
      return;
    }

    setProfileLoading(false);
    setStep(1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0870b0 0%, #0f9fd8 18%, #1ab8ea 40%, #22c4ef 65%, #52d0f5 85%, #cef3fd 97%, #f0faff 100%)" }}>
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-nexus-600/15 rounded-full blur-[120px]" />

      <div className="relative w-full max-w-lg px-4">
        {/* Progress header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <SelloraIcon size={28} />
            <span className="text-white font-bold">Sellora</span>
          </div>
          <div className="flex items-center gap-1.5">
            {steps.map((s, i) => (
              <div
                key={s.id}
                className={`transition-all rounded-full ${
                  i < step
                    ? "w-6 h-1.5 bg-nexus-500"
                    : i === step
                    ? "w-8 h-1.5 bg-nexus-400"
                    : "w-6 h-1.5 bg-white/30"
                }`}
              />
            ))}
          </div>
          <span className="text-white/70 text-xs">{step + 1} of {steps.length}</span>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl shadow-sky-900/20 border border-white/60 p-8">
          {/* Step 0: Profile */}
          {step === 0 && (
            <>
              <div className="w-12 h-12 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center mb-5">
                <SelloraIcon size={28} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Set up your profile</h2>
              <p className="text-gray-500 text-sm mb-6">Your Sellora profile is your creative home base.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Username <span className="text-gray-400">(your sellora.app URL)</span>
                  </label>
                  <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-nexus-500 focus-within:border-transparent">
                    <span className="px-3 flex items-center text-gray-400 text-sm border-r border-gray-200 bg-gray-50">
                      sellora.app/
                    </span>
                    <input
                      type="text"
                      value={profile.username}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                      placeholder="yourname"
                      className="flex-1 px-3 py-2.5 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell people what you create..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nexus-500 resize-none transition-all"
                  />
                </div>

                {profileError && (
                  <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                    {profileError}
                  </div>
                )}

                <Button
                  onClick={handleProfileSave}
                  variant="lime"
                  className="w-full"
                  disabled={!profile.username}
                  loading={profileLoading}
                >
                  Continue
                </Button>
              </div>
            </>
          )}

          {/* Step 1: Goals */}
          {step === 1 && (
            <>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-5">
                <Sparkles className="w-6 h-6 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">What are your goals?</h2>
              <p className="text-gray-500 text-sm mb-6">Select all that apply  —  you can change this later.</p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {goals.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => toggleGoal(id)}
                    className={`relative p-4 rounded-xl border text-left transition-all ${
                      selectedGoals.includes(id)
                        ? "border-nexus-500 bg-nexus-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-nexus-300 hover:bg-sky-50"
                    }`}
                  >
                    {selectedGoals.includes(id) && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-nexus-500 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                    <Icon className={`w-5 h-5 mb-2 ${selectedGoals.includes(id) ? "text-nexus-600" : "text-gray-400"}`} />
                    <div className="text-gray-900 text-sm font-medium">{label}</div>
                  </button>
                ))}
              </div>

              <Button
                onClick={() => setStep(2)}
                variant="lime"
                className="w-full"
                disabled={selectedGoals.length === 0}
              >
                Continue
              </Button>
            </>
          )}

          {/* Step 2: First action */}
          {step === 2 && (
            <>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mb-5">
                <Rocket className="w-6 h-6 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Where do you want to start?</h2>
              <p className="text-gray-500 text-sm mb-6">You can do all of these  —  just pick your first step.</p>

              <div className="space-y-3 mb-6">
                {firstActions.map((action) => (
                  <a
                    key={action.id}
                    href={action.href}
                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-nexus-400 hover:bg-sky-50 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
                      <action.icon className="w-5 h-5 text-nexus-500" />
                    </div>
                    <div>
                      <div className="text-gray-900 font-medium text-sm group-hover:text-nexus-600 transition-colors">
                        {action.title}
                      </div>
                      <div className="text-gray-400 text-xs">{action.desc}</div>
                    </div>
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
