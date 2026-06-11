"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Plus, X, Image as ImageIcon } from "lucide-react";
import { MediaUpload } from "@/components/ui/media-upload";
import { VariantImage } from "@/components/ui/variant-image";

const productTypes = [
  { value: "DIGITAL",      label: "Digital Download", desc: "Files, templates, software, courses" },
  { value: "PHYSICAL",     label: "Physical Product",  desc: "Shipped goods, merch, prints" },
  { value: "SERVICE",      label: "Service",           desc: "Consulting, coaching, custom work" },
  { value: "SUBSCRIPTION", label: "Subscription",      desc: "Recurring membership or access" },
];

const OPTION_TYPE_PRESETS = ["Size", "Color", "Material", "Style", "Weight"];

interface Variant {
  tempId: string;
  optionType: string;
  name: string;
  colorHex: string;
  image: string;
  price: string;
  inventory: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", description: "", price: "", comparePrice: "",
    type: "DIGITAL" as string, inventory: "", coverImage: "", fileUrl: "",
    billingInterval: "month" as "month" | "year",
  });
  const [variants, setVariants] = useState<Variant[]>([]);
  const [metafields, setMetafields] = useState<{ label: string; value: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const addMetafield = () => setMetafields(m => [...m, { label: "", value: "" }]);
  const updateMetafield = (i: number, field: "label" | "value", val: string) =>
    setMetafields(m => m.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)));
  const removeMetafield = (i: number) => setMetafields(m => m.filter((_, idx) => idx !== i));

  const addVariant = (optionType: string) => {
    setVariants(v => [...v, { tempId: `new-${Date.now()}`, optionType, name: "", colorHex: "#000000", image: "", price: "", inventory: "" }]);
  };

  const updateVariant = (tempId: string, field: keyof Variant, value: string) => {
    setVariants(v => v.map(x => x.tempId === tempId ? { ...x, [field]: value } : x));
  };

  const removeVariant = (tempId: string) => setVariants(v => v.filter(x => x.tempId !== tempId));

  const variantGroups: Record<string, Variant[]> = {};
  for (const v of variants) {
    if (!variantGroups[v.optionType]) variantGroups[v.optionType] = [];
    variantGroups[v.optionType].push(v);
  }

  const handleSubmit = async (status: "DRAFT" | "ACTIVE") => {
    if (!form.name || !form.price) { setError("Name and price are required"); return; }
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: Number(form.price),
          comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
          type: form.type,
          status,
          images: form.coverImage ? [form.coverImage] : [],
          inventory: form.inventory ? Number(form.inventory) : null,
          ...(form.type === "DIGITAL" && form.fileUrl && { digital: { fileUrl: form.fileUrl } }),
          ...(form.type === "SUBSCRIPTION" && { billingInterval: form.billingInterval }),
          variants: variants.filter(v => v.name.trim()).map(v => ({
            optionType: v.optionType,
            name: v.name.trim(),
            colorHex: v.colorHex || null,
            image: v.image || null,
            price: v.price ? Number(v.price) : null,
            inventory: v.inventory ? Number(v.inventory) : null,
          })),
          metafields: metafields.filter(m => m.label.trim()).map(m => ({ label: m.label.trim(), value: m.value.trim() })),
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? "Failed to create product"); }
      router.push("/store");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const typeLabel = productTypes.find(t => t.value === form.type)?.label;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/store">
          <button className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Product</h1>
          <p className="text-gray-500 text-sm">Create a new product for your store</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <div className="space-y-5">
        {/* Type selector */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-gray-900 font-semibold mb-4">Product Type</h2>
          <div className="grid grid-cols-2 gap-3">
            {productTypes.map((t) => (
              <button key={t.value} onClick={() => setForm({ ...form, type: t.value })}
                className={`p-3 rounded-xl border text-left transition-all ${form.type === t.value ? "border-[#2e9cfe] bg-nexus-50" : "border-gray-200 hover:border-gray-300"}`}>
                <div className="text-gray-900 text-sm font-medium">{t.label}</div>
                <div className="text-gray-400 text-xs mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <h2 className="text-gray-900 font-semibold">Product Details</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. UI Design System Kit"
              className="w-full h-10 px-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nexus-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe what customers get..." rows={4}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nexus-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (USD) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="29.00" min="0" step="0.01"
                  className="w-full h-10 pl-7 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nexus-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Compare Price <span className="text-gray-400 font-normal">(optional, shows discount)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input type="number" value={form.comparePrice} onChange={(e) => setForm({ ...form, comparePrice: e.target.value })}
                  placeholder="49.00" min="0" step="0.01"
                  className="w-full h-10 pl-7 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nexus-500" />
              </div>
            </div>
          </div>
          {form.type === "PHYSICAL" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Inventory</label>
              <input type="number" value={form.inventory} onChange={(e) => setForm({ ...form, inventory: e.target.value })}
                placeholder="100" min="0"
                className="w-full h-10 px-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nexus-500" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Image</label>
            <MediaUpload value={form.coverImage} onChange={(url) => setForm({ ...form, coverImage: url })} accept="image" compact allowYoutube={false} />
          </div>
          {form.type === "DIGITAL" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Digital File <span className="text-gray-400 font-normal">(delivered to buyer after purchase)</span>
              </label>
              <MediaUpload value={form.fileUrl} onChange={(url) => setForm({ ...form, fileUrl: url })} accept="any" compact allowYoutube={false} placeholder="Upload your file (PDF, ZIP, MP4…)" />
            </div>
          )}
          {form.type === "SUBSCRIPTION" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Billing Interval</label>
              <div className="flex gap-2">
                {(["month", "year"] as const).map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm({ ...form, billingInterval: v })}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      form.billingInterval === v
                        ? "border-[#2e9cfe] bg-nexus-50 text-[#2e9cfe]"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {v === "month" ? "Monthly" : "Yearly"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                Buyers will be charged ${form.price || "0"}/{form.billingInterval} automatically until they cancel.
              </p>
            </div>
          )}
        </div>

        {/* Variants */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-gray-900 font-semibold">Variants</h2>
            <span className="text-xs text-gray-400">{variants.length} option{variants.length !== 1 ? "s" : ""}</span>
          </div>
          <p className="text-gray-400 text-xs mb-4">Add sizes, colors, or other options customers can choose from.</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {OPTION_TYPE_PRESETS.map(type => (
              <button key={type} onClick={() => addVariant(type)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs border border-dashed border-gray-200 text-gray-500 hover:border-[#2e9cfe] hover:text-[#2e9cfe] transition-all">
                <Plus className="w-3 h-3" />+ {type}
              </button>
            ))}
            <button onClick={() => addVariant("Custom")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs border border-dashed border-gray-200 text-gray-500 hover:border-[#2e9cfe] hover:text-[#2e9cfe] transition-all">
              <Plus className="w-3 h-3" />Custom
            </button>
          </div>
          {Object.entries(variantGroups).map(([optionType, groupVariants]) => (
            <div key={optionType} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{optionType}</span>
                <div className="h-px flex-1 bg-gray-100" />
              </div>
              <div className="space-y-2">
                {groupVariants.map(v => (
                  <div key={v.tempId} className="flex items-center gap-2">
                    {optionType.toLowerCase() === "color" && (
                      <input type="color" value={v.colorHex}
                        onChange={e => updateVariant(v.tempId, "colorHex", e.target.value)}
                        className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                    )}
                    <VariantImage value={v.image} onChange={url => updateVariant(v.tempId, "image", url)} />
                    <input value={v.name} onChange={e => updateVariant(v.tempId, "name", e.target.value)}
                      placeholder={optionType.toLowerCase() === "color" ? "e.g. Navy Blue" : optionType === "Size" ? "e.g. S/M (6-10)" : "Option name"}
                      className="flex-1 h-9 px-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nexus-500" />
                    <input type="number" value={v.price} onChange={e => updateVariant(v.tempId, "price", e.target.value)}
                      placeholder="Price (opt)"
                      className="w-24 h-9 px-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nexus-500" />
                    <button onClick={() => removeVariant(v.tempId)}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {variants.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-4">No variants added yet. Click a button above to add options.</p>
          )}
        </div>

        {/* Specifications / custom fields */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-gray-900 font-semibold">Specifications</h2>
            <span className="text-xs text-gray-400">{metafields.length} field{metafields.length !== 1 ? "s" : ""}</span>
          </div>
          <p className="text-gray-400 text-xs mb-4">Add custom detail rows (e.g. Material, Dimensions, Care) shown on the product page.</p>
          <div className="space-y-2">
            {metafields.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={m.label} onChange={e => updateMetafield(i, "label", e.target.value)}
                  placeholder="Label (e.g. Material)"
                  className="w-40 h-9 px-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nexus-500" />
                <input value={m.value} onChange={e => updateMetafield(i, "value", e.target.value)}
                  placeholder="Value (e.g. 100% Cotton)"
                  className="flex-1 h-9 px-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nexus-500" />
                <button onClick={() => removeMetafield(i)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button onClick={addMetafield}
            className="mt-3 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs border border-dashed border-gray-200 text-gray-500 hover:border-[#2e9cfe] hover:text-[#2e9cfe] transition-all">
            <Plus className="w-3 h-3" />Add field
          </button>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/store")} className="text-gray-600 border-gray-200">Cancel</Button>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => handleSubmit("DRAFT")} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Save as Draft
            </Button>
            <Button variant="lime" onClick={() => handleSubmit("ACTIVE")} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Publish Product
            </Button>
          </div>
        </div>
        </div>

        {/* Live preview — fills the space on wide screens and shows how the
            product card will look in the store as you fill in the form. */}
        <aside className="hidden lg:block sticky top-6 space-y-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Live preview</div>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center overflow-hidden">
              {form.coverImage
                ? <img src={form.coverImage} alt="" className="w-full h-full object-cover" />
                : <div className="flex flex-col items-center text-gray-300"><ImageIcon className="w-8 h-8 mb-1" /><span className="text-xs">Product image</span></div>}
            </div>
            <div className="p-4">
              <span className="inline-block text-[11px] font-medium text-[#2e9cfe] bg-nexus-50 px-2 py-0.5 rounded-full mb-2">{typeLabel}</span>
              <h3 className="font-semibold text-gray-900 text-sm truncate">{form.name || "Product name"}</h3>
              <p className="text-gray-500 text-xs mt-1 line-clamp-3">{form.description || "Your product description will appear here."}</p>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-lg font-bold text-gray-900">${form.price ? Number(form.price).toFixed(2) : "0.00"}</span>
                {form.comparePrice && Number(form.comparePrice) > Number(form.price || 0) && (
                  <span className="text-sm text-gray-400 line-through">${Number(form.comparePrice).toFixed(2)}</span>
                )}
                {form.type === "SUBSCRIPTION" && <span className="text-xs text-gray-400">/{form.billingInterval}</span>}
              </div>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 text-center">How your product card will look in your store.</p>
        </aside>
      </div>
    </div>
  );
}
