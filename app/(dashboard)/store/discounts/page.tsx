"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Loader2, Trash2, Pencil, X, Tag, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Discount {
  id: string;
  code: string;
  type: string;
  value: number;
  active: boolean;
  minSubtotal: number;
  usageLimit: number | null;
  usageCount: number;
  expiresAt: string | null;
}

const inputCls = "w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nexus-500";

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Discount | "new" | null>(null);

  const load = () => {
    fetch("/api/discounts").then(r => r.ok ? r.json() : []).then(d => setDiscounts(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const remove = async (id: string) => {
    if (!confirm("Delete this discount code?")) return;
    await fetch(`/api/discounts/${id}`, { method: "DELETE" });
    load();
  };

  const toggleActive = async (d: Discount) => {
    await fetch(`/api/discounts/${d.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !d.active }) });
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/store">
            <button className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Discount Codes</h1>
            <p className="text-gray-500 text-sm">Offer promo codes at checkout</p>
          </div>
        </div>
        <Button variant="lime" onClick={() => setEditing("new")}><Plus className="w-4 h-4" /> New Code</Button>
      </div>

      {editing && (
        <DiscountEditor discount={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}

      {discounts.length === 0 && !editing ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-gray-200 rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4"><Ticket className="w-7 h-7 text-gray-300" /></div>
          <p className="text-gray-900 font-semibold mb-1">No discount codes yet</p>
          <p className="text-gray-500 text-sm mb-5">Create codes like SAVE10 or WELCOME.</p>
          <Button variant="lime" onClick={() => setEditing("new")}><Plus className="w-4 h-4" /> New Code</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {discounts.map(d => {
            const expired = d.expiresAt && new Date(d.expiresAt).getTime() < Date.now();
            const maxed = d.usageLimit != null && d.usageCount >= d.usageLimit;
            return (
              <div key={d.id} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl">
                <div className="w-11 h-11 rounded-xl bg-nexus-50 flex items-center justify-center flex-shrink-0">
                  <Tag className="w-5 h-5 text-[#2e9cfe]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-semibold text-gray-900">{d.code}</p>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                      {d.type === "PERCENT" ? `${d.value}% off` : `$${d.value.toFixed(2)} off`}
                    </span>
                    {!d.active && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Paused</span>}
                    {expired && <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-500">Expired</span>}
                    {maxed && <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-500">Limit reached</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {d.minSubtotal > 0 && `Min $${d.minSubtotal.toFixed(2)} · `}
                    {d.usageLimit != null ? `${d.usageCount}/${d.usageLimit} used` : `${d.usageCount} used`}
                    {d.expiresAt && ` · expires ${new Date(d.expiresAt).toLocaleDateString()}`}
                  </p>
                </div>
                <button onClick={() => toggleActive(d)} className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                  {d.active ? "Pause" : "Activate"}
                </button>
                <button onClick={() => setEditing(d)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => remove(d.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DiscountEditor({ discount, onClose, onSaved }: { discount: Discount | null; onClose: () => void; onSaved: () => void }) {
  const [code, setCode] = useState(discount?.code ?? "");
  const [type, setType] = useState(discount?.type ?? "PERCENT");
  const [value, setValue] = useState(discount?.value?.toString() ?? "");
  const [minSubtotal, setMinSubtotal] = useState(discount?.minSubtotal?.toString() ?? "");
  const [usageLimit, setUsageLimit] = useState(discount?.usageLimit?.toString() ?? "");
  const [expiresAt, setExpiresAt] = useState(discount?.expiresAt ? discount.expiresAt.slice(0, 10) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!code.trim() || !value) { setError("Code and value are required"); return; }
    setSaving(true); setError("");
    try {
      const payload = {
        code, type, value: Number(value),
        minSubtotal: minSubtotal ? Number(minSubtotal) : 0,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        expiresAt: expiresAt || null,
      };
      const res = await fetch(discount ? `/api/discounts/${discount.id}` : "/api/discounts", {
        method: discount ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Failed to save"); }
      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-6 bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">{discount ? "Edit Code" : "New Discount Code"}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Code *</label>
          <input value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder="SAVE10" className={`${inputCls} font-mono`} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
          <div className="flex gap-2">
            {(["PERCENT", "FIXED"] as const).map(t => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`flex-1 h-10 rounded-xl border text-sm font-medium transition-all ${type === t ? "border-[#2e9cfe] bg-nexus-50 text-[#2e9cfe]" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                {t === "PERCENT" ? "% off" : "$ off"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{type === "PERCENT" ? "Percentage off *" : "Amount off ($) *"}</label>
          <input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder={type === "PERCENT" ? "10" : "5.00"} min="0" className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Min. order ($)</label>
          <input type="number" value={minSubtotal} onChange={e => setMinSubtotal(e.target.value)} placeholder="0" min="0" className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Usage limit</label>
          <input type="number" value={usageLimit} onChange={e => setUsageLimit(e.target.value)} placeholder="Unlimited" min="1" className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Expires on</label>
          <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className={inputCls} />
        </div>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex justify-end gap-3 pt-1">
        <Button variant="outline" onClick={onClose} className="text-gray-600 border-gray-200">Cancel</Button>
        <Button variant="lime" onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin" />}{discount ? "Save Changes" : "Create Code"}</Button>
      </div>
    </div>
  );
}
