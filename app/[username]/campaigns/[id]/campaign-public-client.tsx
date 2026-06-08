"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Users, Calendar, Target, CheckCircle2,
  Loader2, AlertCircle, ChevronDown, ChevronUp, Gift,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getInitials } from "@/lib/utils";

interface Reward { id: string; title: string; description: string; amount: number; limit: number | null; claimed: number }
interface Update { id: string; title: string; body: string; createdAt: string }
interface Campaign {
  id: string; title: string; shortDesc: string | null; description: string;
  coverImage: string | null; videoUrl: string | null;
  goal: number; raised: number; category: string | null; deadline: string | null;
  rewards: Reward[]; updates: Update[];
  _count: { backers: number };
}
interface Creator { id: string; name: string | null; username: string | null; image: string | null; bio: string | null }

function timeLeft(deadline: string | null) {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days} day${days !== 1 ? "s" : ""} left`;
  const hours = Math.floor(diff / 3600000);
  return `${hours}h left`;
}

function timeAgo(date: string) {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export default function CampaignPublicClient({
  campaign, creator, sellerHasPayments, currentUserId,
}: {
  campaign: Campaign;
  creator: Creator;
  sellerHasPayments: boolean;
  currentUserId: string | null;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const justBacked = searchParams.get("stripe") === "success";

  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [backing, setBacking] = useState(false);
  const [backError, setBackError] = useState("");
  const [showUpdates, setShowUpdates] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const pct = Math.min(100, Math.round((campaign.raised / campaign.goal) * 100));
  const remaining = timeLeft(campaign.deadline);

  useEffect(() => {
    if (justBacked) {
      // Verify the Stripe session and record the backing.
      const sessionId = searchParams.get("session_id");
      if (sessionId) {
        fetch("/api/orders/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId }) }).catch(() => {});
      }
      setToast("Thank you for backing this campaign!");
      router.replace(`/${creator.username}/campaigns/${campaign.id}`);
    } else if (searchParams.get("stripe") === "cancelled") {
      setToast("Checkout was cancelled.");
      router.replace(`/${creator.username}/campaigns/${campaign.id}`);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleBack = async () => {
    const amount = selectedReward ? selectedReward.amount : Number(customAmount);
    if (!amount || amount < 1) { setBackError("Please select a reward or enter an amount (min $1)"); return; }
    setBacking(true);
    setBackError("");
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/back`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId: selectedReward?.id ?? null, customAmount: amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start checkout");
      window.location.href = data.url;
    } catch (err: any) {
      setBackError(err.message);
      setBacking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-lg text-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {toast}
        </div>
      )}

      {/* Nav */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={`/${creator.username}`} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {creator.name ?? creator.username}
          </Link>
          <span className="text-gray-400 text-xs">{campaign.category ?? "Campaign"}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: campaign info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cover */}
            {campaign.coverImage && (
              <div className="rounded-2xl overflow-hidden aspect-video bg-gray-100">
                <img src={campaign.coverImage} alt={campaign.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{campaign.title}</h1>
              {campaign.shortDesc && <p className="text-gray-500 text-base">{campaign.shortDesc}</p>}
            </div>

            {/* Creator */}
            <div className="flex items-center gap-3 py-4 border-t border-b border-gray-100">
              {creator.image ? (
                <img src={creator.image} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {getInitials(creator.name ?? "?")}
                </div>
              )}
              <div>
                <p className="text-gray-800 font-semibold text-sm">{creator.name}</p>
                <Link href={`/${creator.username}`} className="text-blue-500 text-xs hover:underline">@{creator.username}</Link>
              </div>
            </div>

            {/* Description */}
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
              {campaign.description}
            </div>

            {/* Updates */}
            {campaign.updates.length > 0 && (
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShowUpdates(!showUpdates)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-800 text-sm">Updates ({campaign.updates.length})</span>
                  {showUpdates ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {showUpdates && (
                  <div className="divide-y divide-gray-100">
                    {campaign.updates.map((u) => (
                      <div key={u.id} className="px-5 py-4">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-gray-800 text-sm">{u.title}</p>
                          <span className="text-gray-400 text-xs">{timeAgo(u.createdAt)}</span>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">{u.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: funding + back */}
          <div className="space-y-4">
            {/* Stats */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="mb-4">
                <div className="flex items-end justify-between mb-1.5">
                  <span className="text-2xl font-bold text-gray-900">{formatCurrency(campaign.raised)}</span>
                  <span className="text-gray-400 text-sm">of {formatCurrency(campaign.goal)}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-blue-600 font-semibold text-sm mt-1">{pct}% funded</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <Users className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                  <p className="text-gray-900 font-bold text-lg">{campaign._count.backers}</p>
                  <p className="text-gray-400 text-xs">backers</p>
                </div>
                {remaining && (
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <Calendar className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                    <p className="text-gray-900 font-bold text-sm">{remaining}</p>
                    <p className="text-gray-400 text-xs">remaining</p>
                  </div>
                )}
              </div>

              {/* Back section */}
              {!sellerHasPayments ? (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-700 text-xs text-center">
                  This campaign is not yet accepting payments.
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Reward tiers */}
                  {campaign.rewards.length > 0 && (
                    <div className="space-y-2">
                      {campaign.rewards.map((r) => {
                        const soldOut = r.limit !== null && r.limit <= r.claimed;
                        const selected = selectedReward?.id === r.id;
                        return (
                          <button
                            key={r.id}
                            onClick={() => { if (!soldOut) { setSelectedReward(selected ? null : r); setCustomAmount(""); } }}
                            disabled={soldOut}
                            className={`w-full text-left p-3 rounded-xl border transition-all ${
                              soldOut ? "opacity-50 cursor-not-allowed border-gray-100 bg-gray-50"
                              : selected ? "border-blue-400 bg-blue-50 ring-1 ring-blue-400"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-semibold text-gray-800 text-sm">{r.title}</span>
                              <span className="text-blue-600 font-bold text-sm">${r.amount}</span>
                            </div>
                            <p className="text-gray-500 text-xs leading-relaxed">{r.description}</p>
                            {r.limit && (
                              <p className="text-gray-400 text-xs mt-1">
                                {soldOut ? "Sold out" : `${r.limit - r.claimed} of ${r.limit} remaining`}
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Custom amount */}
                  <div>
                    <p className="text-gray-500 text-xs mb-1.5 flex items-center gap-1">
                      <Gift className="w-3 h-3" />
                      Or pledge a custom amount
                    </p>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={customAmount}
                        onChange={(e) => { setCustomAmount(e.target.value); setSelectedReward(null); }}
                        placeholder="Enter amount"
                        className="w-full h-9 pl-7 pr-3 rounded-xl border border-gray-200 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {backError && (
                    <div className="flex items-center gap-1.5 text-red-500 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {backError}
                    </div>
                  )}

                  <button
                    onClick={handleBack}
                    disabled={backing}
                    className="w-full h-10 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {backing && <Loader2 className="w-4 h-4 animate-spin" />}
                    {selectedReward ? `Back for $${selectedReward.amount}` : customAmount ? `Back for $${customAmount}` : "Back this campaign"}
                  </button>

                  <p className="text-gray-400 text-[11px] text-center">
                    Secure checkout powered by Stripe.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
