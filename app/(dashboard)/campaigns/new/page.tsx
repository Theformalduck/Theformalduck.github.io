"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Sparkles, Plus, Minus, Rocket, DollarSign, Calendar, Wand2, Loader2, CheckCircle2,
} from "lucide-react";
import { MediaUpload } from "@/components/ui/media-upload";

const categories = ["Art & Design", "Education", "Software", "Photography", "Music", "Games", "Film", "Fashion", "Technology"];

const defaultTiers = [
  { id: 1, amount: 10, title: "Early Supporter", perks: "Digital thank-you card + name in credits", limit: null },
  { id: 2, amount: 50, title: "Backer", perks: "Early access + all digital files", limit: 100 },
  { id: 3, amount: 150, title: "Champion", perks: "Everything + 1:1 review session (30 min)", limit: 20 },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: "",
    description: "",
    shortDesc: "",
    goal: "",
    deadline: "",
    category: "",
    coverImage: "",
  });
  const [tiers, setTiers] = useState(defaultTiers);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const totalSteps = 4;

  const handleAI = async () => {
    if (!form.title) return;
    setAiGenerating(true);
    await new Promise((r) => setTimeout(r, 1200));
    setForm((prev) => ({
      ...prev,
      shortDesc: `Support ${prev.title} — a creative project that pushes boundaries and delivers real value to backers.`,
      description: `${prev.title} is a passion project I've been building for months. I need your support to bring it to life!\n\nWhat you'll get:\n• Access to all finished files and deliverables\n• Regular updates throughout the process\n• Lifetime access to everything we create together\n\nYour backing means everything. Let's make this happen!`,
    }));
    setAiGenerating(false);
  };

  const handleSubmit = async (status: "DRAFT" | "ACTIVE") => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          goal: Number(form.goal),
          status,
          rewards: tiers.filter((t) => t.title),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create campaign");
      }
      router.push("/campaigns");
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/campaigns">
          <button className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Campaign</h1>
          <p className="text-gray-500 text-sm">Step {step} of {totalSteps}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} onClick={() => i + 1 < step && setStep(i + 1)}
              className={`rounded-full transition-all h-1.5 cursor-pointer ${
                i + 1 < step ? "w-6 bg-nexus-500" : i + 1 === step ? "w-8 bg-nexus-400" : "w-6 bg-sky-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step 1: Basics */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-gray-900 font-semibold">Campaign Basics</h2>
              <Button variant="outline" size="sm" onClick={handleAI} loading={aiGenerating}
                disabled={!form.title || aiGenerating}
                className="text-nexus-600 border-nexus-200 hover:bg-nexus-50 text-xs gap-1.5">
                <Wand2 className="w-3.5 h-3.5" />AI Write for me
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Campaign Title *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Digital Art Masterclass for Beginners"
                  className="w-full h-10 px-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nexus-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Short Description</label>
                <input value={form.shortDesc} onChange={(e) => setForm({ ...form, shortDesc: e.target.value })}
                  placeholder="One sentence that hooks potential backers..."
                  className="w-full h-10 px-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nexus-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Description *</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Tell your story. What are you creating? Why does it matter?"
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nexus-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-nexus-500">
                    <option value="">Select category...</option>
                    {categories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Cover Image</label>
                <MediaUpload value={form.coverImage} onChange={(url) => setForm({ ...form, coverImage: url })} accept="image" compact allowYoutube={false} />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="lime" onClick={() => setStep(2)} disabled={!form.title || !form.description}>
              Continue to Funding
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Funding */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-gray-900 font-semibold mb-5">Funding Goal & Timeline</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Funding Goal *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="number" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}
                    placeholder="10000" min="1"
                    className="w-full h-10 pl-9 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nexus-500" />
                </div>
                <p className="text-gray-400 text-xs mt-1">Set a realistic goal. You keep all funds raised.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Campaign End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                    className="w-full h-10 pl-9 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-nexus-500" />
                </div>
                <p className="text-gray-400 text-xs mt-1">Campaigns can run 1–60 days. 30 days is the sweet spot.</p>
              </div>
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)} className="text-gray-600 border-gray-200">Back</Button>
            <Button variant="lime" onClick={() => setStep(3)} disabled={!form.goal}>Continue to Rewards</Button>
          </div>
        </div>
      )}

      {/* Step 3: Rewards */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-gray-900 font-semibold mb-5">Reward Tiers</h2>
            <div className="space-y-3 mb-4">
              {tiers.map((tier) => (
                <div key={tier.id} className="p-4 rounded-xl border border-gray-200 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <input type="number" value={tier.amount}
                        onChange={(e) => setTiers(tiers.map((t) => t.id === tier.id ? { ...t, amount: Number(e.target.value) } : t))}
                        className="w-20 h-7 px-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-nexus-500" />
                      <span className="text-gray-400 text-sm">minimum pledge</span>
                    </div>
                    <button onClick={() => setTiers(tiers.filter((t) => t.id !== tier.id))} className="text-gray-400 hover:text-red-400 transition-colors">
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                  <input value={tier.title}
                    onChange={(e) => setTiers(tiers.map((t) => t.id === tier.id ? { ...t, title: e.target.value } : t))}
                    placeholder="Tier name" className="w-full h-8 px-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-nexus-500 placeholder:text-gray-400" />
                  <input value={tier.perks}
                    onChange={(e) => setTiers(tiers.map((t) => t.id === tier.id ? { ...t, perks: e.target.value } : t))}
                    placeholder="What backers get..." className="w-full h-8 px-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-nexus-500 placeholder:text-gray-400" />
                </div>
              ))}
            </div>
            <button onClick={() => setTiers([...tiers, { id: Date.now(), amount: 25, title: "", perks: "", limit: null }])}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-gray-200 text-gray-400 hover:text-gray-700 hover:border-nexus-200 transition-all text-sm">
              <Plus className="w-4 h-4" />Add reward tier
            </button>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)} className="text-gray-600 border-gray-200">Back</Button>
            <Button variant="lime" onClick={() => setStep(4)}>Continue to Review</Button>
          </div>
        </div>
      )}

      {/* Step 4: Review & Launch */}
      {step === 4 && (
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-gray-900 font-semibold mb-5">Review & Launch</h2>
            <div className="space-y-3">
              {[
                { label: "Title", value: form.title },
                { label: "Goal", value: form.goal ? `$${Number(form.goal).toLocaleString()}` : "—" },
                { label: "Deadline", value: form.deadline || "No deadline set" },
                { label: "Category", value: form.category || "—" },
                { label: "Reward Tiers", value: `${tiers.filter((t) => t.title).length} tiers` },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">{label}</span>
                  <span className="text-gray-700 text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>
            {form.coverImage && (
              <div className="mt-4">
                <p className="text-gray-500 text-sm mb-2">Cover Image</p>
                <img src={form.coverImage} alt="cover" className="w-full h-32 object-cover rounded-xl" />
              </div>
            )}
          </div>

          <div className="bg-nexus-50 border border-nexus-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-nexus-600 mt-0.5" />
              <div>
                <p className="text-nexus-600 text-sm font-semibold mb-1">Ready to launch?</p>
                <p className="text-gray-500 text-xs">Save as draft to keep editing, or launch immediately to start accepting backers.</p>
              </div>
            </div>
          </div>

          {submitError && (
            <p className="text-red-500 text-sm text-center">{submitError}</p>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(3)} className="text-gray-600 border-gray-200">Back</Button>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => handleSubmit("DRAFT")} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save as Draft
              </Button>
              <Button variant="lime" onClick={() => handleSubmit("ACTIVE")} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                Launch Campaign
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
