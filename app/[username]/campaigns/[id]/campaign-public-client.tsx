"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Users, Calendar, Target, CheckCircle2,
  Loader2, AlertCircle, Gift, FileText, Megaphone, HelpCircle,
  MessageSquare, Trash2, Send,
} from "lucide-react";
import { formatCurrency, getInitials, cn } from "@/lib/utils";
import type { FaqItem, StretchGoal } from "@/lib/campaign-extras";

interface Reward { id: string; title: string; description: string; amount: number; limit: number | null; claimed: number }
interface Update { id: string; title: string; body: string; createdAt: string }
interface CommentItem {
  id: string; body: string; createdAt: string; userId: string;
  user: { name: string | null; username: string | null; image: string | null };
}
interface Campaign {
  id: string; title: string; shortDesc: string | null; description: string;
  coverImage: string | null; videoUrl: string | null; images: string[];
  goal: number; raised: number; category: string | null; deadline: string | null;
  rewards: Reward[]; updates: Update[];
  faq: FaqItem[]; stretchGoals: StretchGoal[];
  _count: { backers: number };
}

type Tab = "story" | "updates" | "faq" | "comments";
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
  const [toast, setToast] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>("story");
  const [comments, setComments] = useState<CommentItem[] | null>(null);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  const pct = Math.min(100, Math.round((campaign.raised / campaign.goal) * 100));
  const remaining = timeLeft(campaign.deadline);

  // Hero = cover (or first gallery image as fallback); gallery shows the rest.
  const heroImage = campaign.coverImage || campaign.images[0] || null;
  const galleryImages = campaign.images.filter((src) => src !== heroImage);

  // Lazy-load comments the first time the Comments tab is opened.
  useEffect(() => {
    if (tab !== "comments" || comments !== null) return;
    fetch(`/api/campaigns/${campaign.id}/comments`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setComments(Array.isArray(d) ? d : []))
      .catch(() => setComments([]));
  }, [tab, comments, campaign.id]);

  const postComment = async () => {
    const body = commentText.trim();
    if (!body) return;
    setPostingComment(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to post comment");
      setComments((prev) => [data, ...(prev ?? [])]);
      setCommentText("");
    } catch (err: any) {
      setToast(err.message ?? "Failed to post comment");
    } finally {
      setPostingComment(false);
    }
  };

  const deleteComment = async (id: string) => {
    setComments((prev) => (prev ?? []).filter((c) => c.id !== id));
    await fetch(`/api/campaigns/${campaign.id}/comments/${id}`, { method: "DELETE" }).catch(() => {});
  };

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { id: "story", label: "Story", icon: FileText },
    { id: "updates", label: "Updates", icon: Megaphone, count: campaign.updates.length },
    { id: "faq", label: "FAQ", icon: HelpCircle, count: campaign.faq.length },
    { id: "comments", label: "Comments", icon: MessageSquare, count: comments?.length },
  ];

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
            {/* Cover + gallery */}
            {heroImage && (
              <div className="rounded-2xl overflow-hidden aspect-video bg-gray-100">
                <img src={heroImage} alt={campaign.title} className="w-full h-full object-cover" />
              </div>
            )}
            {galleryImages.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {galleryImages.map((src, i) => (
                  <a
                    key={i}
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-100 hover:opacity-90 transition-opacity"
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </a>
                ))}
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

            {/* Tabs */}
            <div className="border-b border-gray-200 flex items-center gap-1 overflow-x-auto">
              {tabs.map(({ id, label, icon: Icon, count }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors",
                    tab === id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {typeof count === "number" && count > 0 && (
                    <span className="text-xs text-gray-400">({count})</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab: Story */}
            {tab === "story" && (
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                {campaign.description}
              </div>
            )}

            {/* Tab: Updates */}
            {tab === "updates" && (
              campaign.updates.length === 0 ? (
                <p className="text-gray-400 text-sm py-8 text-center">No updates yet.</p>
              ) : (
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden">
                  {campaign.updates.map((u) => (
                    <div key={u.id} className="px-5 py-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-gray-800 text-sm">{u.title}</p>
                        <span className="text-gray-400 text-xs">{timeAgo(u.createdAt)}</span>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{u.body}</p>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Tab: FAQ */}
            {tab === "faq" && (
              campaign.faq.length === 0 ? (
                <p className="text-gray-400 text-sm py-8 text-center">No FAQ yet.</p>
              ) : (
                <div className="space-y-2">
                  {campaign.faq.map((f, i) => (
                    <details key={i} className="group border border-gray-200 rounded-xl overflow-hidden">
                      <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer list-none font-medium text-gray-800 text-sm hover:bg-gray-50">
                        {f.question}
                        <HelpCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      </summary>
                      <p className="px-4 pb-4 text-gray-600 text-sm leading-relaxed whitespace-pre-line">{f.answer}</p>
                    </details>
                  ))}
                </div>
              )
            )}

            {/* Tab: Comments */}
            {tab === "comments" && (
              <div className="space-y-4">
                {currentUserId ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Leave a comment for the creator and backers…"
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                    />
                    <button
                      onClick={postComment}
                      disabled={postingComment || !commentText.trim()}
                      className="self-end inline-flex items-center gap-1.5 px-4 h-9 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm transition-colors disabled:opacity-50"
                    >
                      {postingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Post
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-sm text-gray-500 text-center">
                    <Link href="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link> to join the conversation.
                  </div>
                )}

                {comments === null ? (
                  <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
                ) : comments.length === 0 ? (
                  <p className="text-gray-400 text-sm py-8 text-center">No comments yet. Be the first!</p>
                ) : (
                  <div className="space-y-3">
                    {comments.map((c) => {
                      const canDelete = currentUserId === c.userId || currentUserId === creator.id;
                      return (
                        <div key={c.id} className="flex items-start gap-3">
                          {c.user.image ? (
                            <img src={c.user.image} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {getInitials(c.user.name ?? c.user.username ?? "?")}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-800 font-semibold text-sm">{c.user.name ?? c.user.username ?? "User"}</span>
                              <span className="text-gray-400 text-xs">{timeAgo(c.createdAt)}</span>
                              {canDelete && (
                                <button onClick={() => deleteComment(c.id)} className="ml-auto text-gray-300 hover:text-red-500 transition-colors" title="Delete comment">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{c.body}</p>
                          </div>
                        </div>
                      );
                    })}
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

            {/* Stretch goals */}
            {campaign.stretchGoals.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5 mb-3">
                  <Target className="w-4 h-4 text-blue-500" /> Stretch goals
                </h3>
                <div className="space-y-2.5">
                  {campaign.stretchGoals.map((g, i) => {
                    const reached = campaign.raised >= g.amount;
                    return (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className={cn("mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0", reached ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400")}>
                          {reached ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn("text-sm font-semibold", reached ? "text-gray-900" : "text-gray-700")}>{formatCurrency(g.amount)}</span>
                            <span className="text-gray-500 text-sm truncate">{g.title}</span>
                          </div>
                          {g.description && <p className="text-gray-400 text-xs leading-relaxed">{g.description}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
