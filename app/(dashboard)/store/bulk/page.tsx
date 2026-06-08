"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Download, Upload, Loader2, Check, AlertCircle, ArrowLeft, Package, ShoppingBag, Boxes, Users } from "lucide-react";

type ImportResult = { created?: number; updated?: number; errors?: string[]; total?: number } | null;

function ExportRow({ label, desc, icon: Icon, url, file }: { label: string; desc: string; icon: any; url: string; file: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const run = async () => {
    setBusy(true); setErr("");
    try {
      const res = await fetch(url);
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error ?? "Export failed"); }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = file; a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) { setErr(e instanceof Error ? e.message : "Export failed"); }
    finally { setBusy(false); }
  };
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4 text-gray-500" /></div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900">{label}</div>
        <div className="text-xs text-gray-400">{err || desc}</div>
      </div>
      <button onClick={run} disabled={busy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} CSV
      </button>
    </div>
  );
}

function ImportRow({ label, desc, icon: Icon, url, template }: { label: string; desc: string; icon: any; url: string; template: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult>(null);
  const [err, setErr] = useState("");

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true); setErr(""); setResult(null);
    try {
      const text = await f.text();
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ csv: text }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setResult(data);
    } catch (e) { setErr(e instanceof Error ? e.message : "Import failed"); }
    finally { setBusy(false); if (inputRef.current) inputRef.current.value = ""; }
  };

  const count = result ? (result.created ?? result.updated ?? 0) : 0;
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4 text-gray-500" /></div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900">{label}</div>
          <div className="text-xs text-gray-400">{desc}</div>
        </div>
        <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
        <button onClick={() => inputRef.current?.click()} disabled={busy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2e9cfe] text-white text-sm font-medium hover:bg-[#1a8cf0] disabled:opacity-50">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Upload
        </button>
      </div>
      <p className="text-[11px] text-gray-400 mt-1.5 ml-12">Columns: <code className="bg-gray-100 px-1 rounded">{template}</code></p>
      {err && <p className="text-xs text-red-500 mt-1.5 ml-12 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {err}</p>}
      {result && (
        <div className="mt-2 ml-12 text-xs">
          <p className="text-emerald-600 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> {count} {result.updated != null ? "updated" : "created"} of {result.total} rows.</p>
          {result.errors && result.errors.length > 0 && (
            <details className="mt-1"><summary className="text-amber-600 cursor-pointer">{result.errors.length} row(s) skipped</summary>
              <ul className="mt-1 text-gray-500 space-y-0.5 max-h-32 overflow-auto">{result.errors.slice(0, 30).map((e, i) => <li key={i}>· {e}</li>)}</ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

export default function BulkPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/store" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-3"><ArrowLeft className="w-4 h-4" /> Store</Link>
      <h1 className="text-2xl font-bold text-gray-900">Import &amp; export</h1>
      <p className="text-gray-500 text-sm mt-0.5 mb-6">Move products, inventory, orders and customers in and out as CSV files.</p>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-5">
        <div className="px-4 py-2.5 border-b border-gray-100 text-sm font-semibold text-gray-900">Export</div>
        <div className="divide-y divide-gray-100">
          <ExportRow label="Products" desc="All products with prices, type & stock" icon={Package} url="/api/products/export" file="products.csv" />
          <ExportRow label="Inventory" desc="Current stock levels" icon={Boxes} url="/api/inventory" file="inventory.csv" />
          <ExportRow label="Orders" desc="Orders with status, totals & tracking" icon={ShoppingBag} url="/api/orders/export" file="orders.csv" />
          <ExportRow label="Customers" desc="Buyers with order counts & spend" icon={Users} url="/api/customers/export" file="customers.csv" />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 text-sm font-semibold text-gray-900">Import</div>
        <div className="divide-y divide-gray-100">
          <ImportRow label="Products" desc="Bulk-create products from a CSV" icon={Package} url="/api/products/import" template="name, price, description, compare_price, type, status, inventory, image_urls" />
          <ImportRow label="Inventory" desc="Bulk-update stock (export, edit, re-upload)" icon={Boxes} url="/api/inventory" template="product_id or name, inventory" />
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-3">Tip: export a file first to get a correctly-formatted template, edit it, then re-upload.</p>
    </div>
  );
}
