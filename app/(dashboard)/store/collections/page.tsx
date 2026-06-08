"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Loader2, Trash2, Pencil, X, Check, FolderPlus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaUpload } from "@/components/ui/media-upload";

interface ProductLite { id: string; name: string; images: string[]; price: number; }
interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  products: { id: string }[];
  _count: { products: number };
}

const inputCls = "w-full h-10 px-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nexus-500";

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Collection | "new" | null>(null);

  const load = () => {
    Promise.all([
      fetch("/api/collections").then(r => r.ok ? r.json() : []),
      fetch("/api/products").then(r => r.ok ? r.json() : []),
    ]).then(([cols, prods]) => {
      setCollections(Array.isArray(cols) ? cols : []);
      setProducts(Array.isArray(prods) ? prods.map((p: any) => ({ id: p.id, name: p.name, images: p.images ?? [], price: p.price })) : []);
    }).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const remove = async (id: string) => {
    if (!confirm("Delete this collection? Products are not deleted.")) return;
    await fetch(`/api/collections/${id}`, { method: "DELETE" });
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
            <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
            <p className="text-gray-500 text-sm">Group products into browsable collections</p>
          </div>
        </div>
        <Button variant="lime" onClick={() => setEditing("new")}>
          <Plus className="w-4 h-4" /> New Collection
        </Button>
      </div>

      {editing && (
        <CollectionEditor
          collection={editing === "new" ? null : editing}
          products={products}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}

      {collections.length === 0 && !editing ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-gray-200 rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
            <FolderPlus className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-gray-900 font-semibold mb-1">No collections yet</p>
          <p className="text-gray-500 text-sm mb-5">Create collections like "New Arrivals" or "Best Sellers".</p>
          <Button variant="lime" onClick={() => setEditing("new")}><Plus className="w-4 h-4" /> New Collection</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {collections.map(c => (
            <div key={c.id} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                {c.image ? <img src={c.image} alt="" className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-gray-300" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{c.name}</p>
                <p className="text-xs text-gray-500">/{c.slug} · {c._count.products} product{c._count.products !== 1 ? "s" : ""}</p>
              </div>
              <button onClick={() => setEditing(c)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100" title="Edit">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => remove(c.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CollectionEditor({ collection, products, onClose, onSaved }: {
  collection: Collection | null;
  products: ProductLite[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(collection?.name ?? "");
  const [description, setDescription] = useState(collection?.description ?? "");
  const [image, setImage] = useState(collection?.image ?? "");
  const [selected, setSelected] = useState<Set<string>>(new Set(collection?.products.map(p => p.id) ?? []));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggle = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const save = async () => {
    if (!name.trim()) { setError("Name is required"); return; }
    setSaving(true); setError("");
    try {
      const payload = { name, description, image: image || null, productIds: Array.from(selected) };
      const res = await fetch(collection ? `/api/collections/${collection.id}` : "/api/collections", {
        method: collection ? "PUT" : "POST",
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
        <h2 className="font-semibold text-gray-900">{collection ? "Edit Collection" : "New Collection"}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. New Arrivals" className={inputCls} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
          placeholder="Optional description shown on the collection page"
          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nexus-500 resize-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Cover image</label>
        <MediaUpload value={image} onChange={setImage} accept="image" compact allowYoutube={false} />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Products</label>
          <span className="text-xs text-gray-400">{selected.size} selected</span>
        </div>
        {products.length === 0 ? (
          <p className="text-sm text-gray-400 py-3">No products yet. Add products first.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 max-h-72 overflow-auto">
            {products.map(p => {
              const on = selected.has(p.id);
              return (
                <button key={p.id} onClick={() => toggle(p.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${on ? "border-[#2e9cfe] bg-nexus-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                    {p.images[0] ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-gray-300" />}
                  </div>
                  <span className="text-xs text-gray-800 flex-1 line-clamp-2">{p.name}</span>
                  {on && <Check className="w-4 h-4 text-[#2e9cfe] flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onClose} className="text-gray-600 border-gray-200">Cancel</Button>
        <Button variant="lime" onClick={save} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {collection ? "Save Changes" : "Create Collection"}
        </Button>
      </div>
    </div>
  );
}
