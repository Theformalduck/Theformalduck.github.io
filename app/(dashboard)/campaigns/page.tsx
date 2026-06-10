"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Rocket, Users, Clock, TrendingUp, Search, MoreHorizontal,
  Eye, Edit3, Share2, Trash2, DollarSign, CheckCircle, Loader2,
} from "lucide-react";
import { formatCurrency, formatNumber, daysRemaining, cn } from "@/lib/utils";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useRouter } from "next/navigation";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  const load = () => {
    setLoading(true);
    fetch("/api/campaigns")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setCampaigns(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this campaign? This cannot be undone.")) return;
    setDeleting(id);
    const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } else {
      alert("Failed to delete campaign. Please try again.");
    }
    setDeleting(null);
  };

  const handleStatusChange = async (id: string, status: string) => {
    const res = await fetch(`/api/campaigns/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCampaigns((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } else {
      alert("Failed to update campaign status. Please try again.");
    }
  };

  const filtered = campaigns.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || c.status.toLowerCase() === filter;
    return matchSearch && matchFilter;
  });

  const totalRaised = campaigns.reduce((s, c) => s + c.raised, 0);
  const totalBackers = campaigns.reduce((s, c) => s + (c._count?.backers ?? 0), 0);
  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE").length;
  const funded = campaigns.filter((c) => c.status === "FUNDED").length;
  const successRate = campaigns.length > 0 ? Math.round((funded / campaigns.length) * 100) : 0;

  const stats = [
    { label: "Total Raised", value: formatCurrency(totalRaised), icon: DollarSign, color: "emerald" },
    { label: "Total Backers", value: formatNumber(totalBackers), icon: Users, color: "blue" },
    { label: "Active Campaigns", value: activeCampaigns.toString(), icon: Rocket, color: "nexus" },
    { label: "Success Rate", value: `${successRate}%`, icon: CheckCircle, color: "amber" },
  ];

  function statusBadge(status: string) {
    switch (status) {
      case "FUNDED": return <Badge variant="success">✓ Funded</Badge>;
      case "ACTIVE": return <Badge variant="default">Active</Badge>;
      case "DRAFT": return <Badge variant="secondary">Draft</Badge>;
      case "FAILED": return <Badge variant="destructive">Failed</Badge>;
      case "CANCELLED": return <Badge variant="secondary">Cancelled</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your crowdfunding campaigns</p>
        </div>
        <Link href="/campaigns/new">
          <Button variant="lime"><Plus className="w-4 h-4" />New Campaign</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-xl bg-${color}-500/15 flex items-center justify-center`}>
                <Icon className={`w-4 h-4 text-${color}-400`} />
              </div>
              <span className="text-gray-500 text-xs">{label}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            className="w-full h-9 pl-9 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nexus-500 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {["all", "active", "draft", "funded", "failed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-sm capitalize transition-all",
                filter === f
                  ? "bg-nexus-500/20 text-nexus-600 border border-nexus-200"
                  : "text-gray-400 hover:text-gray-700 border border-gray-200"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Campaign list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-gray-200 rounded-2xl">
          <Rocket className="w-10 h-10 text-gray-200 mb-3" />
          <h3 className="text-gray-900 font-semibold mb-1">No campaigns yet</h3>
          <p className="text-gray-400 text-sm mb-4">Create your first crowdfunding campaign to get started.</p>
          <Link href="/campaigns/new">
            <Button variant="lime"><Plus className="w-4 h-4" />New Campaign</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => {
            const progress = Math.min(Math.round((c.raised / c.goal) * 100), 100);
            const days = c.deadline ? daysRemaining(c.deadline) : null;
            const isDeleting = deleting === c.id;

            return (
              <div key={c.id} className={cn("group bg-white border border-gray-200 rounded-2xl p-4 transition-all hover:border-nexus-300 hover:shadow-md", isDeleting && "opacity-50 pointer-events-none")}>
                <div className="flex items-stretch gap-4">
                  <div className="w-28 sm:w-36 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-nexus-500/15 to-cyan-500/10 flex items-center justify-center">
                    {c.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.coverImage} alt={c.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" />
                    ) : (
                      <Rocket className="w-7 h-7 text-nexus-400/70" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-gray-900 font-semibold">{c.title}</h3>
                          {statusBadge(c.status)}
                          {c.category && <Badge variant="outline" className="text-gray-400 border-gray-200">{c.category}</Badge>}
                        </div>
                        {c.shortDesc && <p className="text-gray-500 text-sm mt-0.5 line-clamp-1">{c.shortDesc}</p>}
                      </div>

                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <button className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all flex-shrink-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content className="z-50 w-44 rounded-xl bg-white border border-gray-200 shadow-xl p-1" sideOffset={4} align="end">
                            {c.status === "DRAFT" && (
                              <DropdownMenu.Item
                                onClick={() => handleStatusChange(c.id, "ACTIVE")}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer outline-none text-emerald-600 hover:bg-emerald-50 transition-all"
                              >
                                <Rocket className="w-3.5 h-3.5" />Launch Campaign
                              </DropdownMenu.Item>
                            )}
                            {c.status === "ACTIVE" && (
                              <DropdownMenu.Item
                                onClick={() => handleStatusChange(c.id, "DRAFT")}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer outline-none text-gray-700 hover:bg-gray-50 transition-all"
                              >
                                <Eye className="w-3.5 h-3.5" />Pause to Draft
                              </DropdownMenu.Item>
                            )}
                            <DropdownMenu.Item
                              onClick={() => router.push(`/campaigns/${c.id}/edit`)}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer outline-none text-gray-700 hover:bg-gray-50 transition-all"
                            >
                              <Edit3 className="w-3.5 h-3.5" />Edit
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              onClick={() => {
                                navigator.clipboard?.writeText(`${window.location.origin}/campaigns/${c.id}`);
                              }}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer outline-none text-gray-700 hover:bg-gray-50 transition-all"
                            >
                              <Share2 className="w-3.5 h-3.5" />Copy Link
                            </DropdownMenu.Item>
                            <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />
                            <DropdownMenu.Item
                              onClick={() => handleDelete(c.id)}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer outline-none text-red-400 hover:bg-red-500/10 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />Delete
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </div>

                    <div className="mt-auto pt-3">
                      <div className="flex items-end justify-between gap-3 mb-1.5">
                        <div className="flex items-baseline gap-1.5 min-w-0">
                          <span className="text-gray-900 font-bold">{formatCurrency(c.raised)}</span>
                          <span className="text-gray-400 text-xs truncate">of {formatCurrency(c.goal)} goal</span>
                        </div>
                        <span className={cn("text-sm font-bold flex-shrink-0", c.status === "FUNDED" ? "text-emerald-600" : "text-nexus-600")}>
                          {progress}%
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            c.status === "FUNDED" ? "bg-emerald-500" : "bg-gradient-to-r from-nexus-600 to-cyan-500"
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-4 mt-2.5 text-xs text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {formatNumber(c._count?.backers ?? 0)} backers
                        </span>
                        {days !== null && c.status !== "FUNDED" && (
                          <span className={cn("inline-flex items-center gap-1", days < 7 && "text-amber-500")}>
                            <Clock className="w-3.5 h-3.5" />
                            {days === 0 ? "Ended" : `${days} days left`}
                          </span>
                        )}
                        {c.status === "FUNDED" && (
                          <span className="inline-flex items-center gap-1 text-emerald-500">
                            <TrendingUp className="w-3.5 h-3.5" />
                            Funded
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
