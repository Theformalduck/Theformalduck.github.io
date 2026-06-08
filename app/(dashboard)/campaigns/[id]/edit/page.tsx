"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, DollarSign, Calendar, Plus, Minus, Loader2, Trash2,
} from "lucide-react";
import { MediaUpload } from "@/components/ui/media-upload";

const categories = ["Art & Design", "Education", "Software", "Photography", "Music", "Games", "Film", "Fashion", "Technology"];

export default function EditCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [form, setForm] = useState({
    title: "", description: "", shortDesc: "", goal: "",
    deadline: "", category: "", coverImage: "",
  });
  const [tiers, setTiers] = useState<{ id: string; amount: number; title: string; perks: string; limit: number | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/campaigns/${id}`)
      .then(r => {
        if (!r.ok) { router.push("/campaigns"); return null; }
        return r.json();
      })
      .then((c: any) => {
        if (!c) return;
        setForm({
          title: c.title ?? "",
          description: c.description ?? "",
          shortDesc: c.shortDesc ?? "",
          goal: c.goal?.toString() ?? "",
          deadline: c.deadline ? new Date(c.deadline).toISOString().split("T")[0] : "",
          category: c.category ?? "",
          coverImage: c.coverImage ?? "",
        });
        setTiers((c.rewards ?? []).map((r: any) => ({
          id: r.id,
          amount: r.amount,
          title: r.title,
          perks: r.description,
          limit: r.limit ?? null,
        })));
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (status?: string) => {
    if (!form.title || !form.goal) { setError("Title and goal are required"); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          goal: Number(form.goal),
          ...(status && { status }),
          rewards: tiers.filter(t => t.title),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save");
      }
      router.push("/campaigns");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this campaign? This cannot be undone.")) return;
    setDeleting(true);
    const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/campaigns");
    } else {
      setError("Failed to delete campaign.");
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

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/campaigns">
          <button className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Campaign</h1>
          <p className="text-gray-500 text-sm">{form.title}</p>
        </div>
        <button onClick={handleDelete} disabled={deleting}
          className="ml-auto flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl transition-all disabled:opacity-50">
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          Delete
        </button>
      </div>

      <div className="space-y-5">
        {/* Basics */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <h2 className="text-gray-900 font-semibold">Campaign Basics</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Campaign Title *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full h-10 px-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nexus-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Short Description</label>
            <input value={form.shortDesc} onChange={e => setForm({ ...form, shortDesc: e.target.value })}
              placeholder="One sentence hook..."
              className="w-full h-10 px-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nexus-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Description *</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={5} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-nexus-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-nexus-500">
                <option value="">Select category...</option>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Cover Image</label>
            <MediaUpload value={form.coverImage} onChange={url => setForm({ ...form, coverImage: url })} accept="image" compact allowYoutube={false} />
          </div>
        </div>

        {/* Funding */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <h2 className="text-gray-900 font-semibold">Funding Goal & Timeline</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Funding Goal *</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="number" value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })}
                className="w-full h-10 pl-9 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-nexus-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Campaign End Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })}
                className="w-full h-10 pl-9 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-nexus-500" />
            </div>
          </div>
        </div>

        {/* Rewards */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-gray-900 font-semibold mb-5">Reward Tiers</h2>
          <div className="space-y-3 mb-4">
            {tiers.map((tier, i) => (
              <div key={tier.id} className="p-4 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <input type="number" value={tier.amount}
                      onChange={e => setTiers(tiers.map((t, j) => j === i ? { ...t, amount: Number(e.target.value) } : t))}
                      className="w-20 h-7 px-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-nexus-500" />
                    <span className="text-gray-400 text-sm">minimum</span>
                  </div>
                  <button onClick={() => setTiers(tiers.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-400 transition-colors">
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
                <input value={tier.title}
                  onChange={e => setTiers(tiers.map((t, j) => j === i ? { ...t, title: e.target.value } : t))}
                  placeholder="Tier name"
                  className="w-full h-8 px-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-nexus-500 placeholder:text-gray-400" />
                <input value={tier.perks}
                  onChange={e => setTiers(tiers.map((t, j) => j === i ? { ...t, perks: e.target.value } : t))}
                  placeholder="What backers get..."
                  className="w-full h-8 px-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-nexus-500 placeholder:text-gray-400" />
              </div>
            ))}
          </div>
          <button
            onClick={() => setTiers([...tiers, { id: `new-${Date.now()}`, amount: 25, title: "", perks: "", limit: null }])}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-gray-200 text-gray-400 hover:text-gray-700 hover:border-nexus-200 transition-all text-sm">
            <Plus className="w-4 h-4" />Add reward tier
          </button>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex items-center justify-between">
          <Link href="/campaigns">
            <Button variant="outline" className="text-gray-600 border-gray-200">Cancel</Button>
          </Link>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => handleSave()} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save Draft
            </Button>
            <Button variant="lime" onClick={() => handleSave("ACTIVE")} disabled={submitting}>
              Save & Publish
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
