"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Loader2, Package, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface WishItem {
  id: string; name: string; price: number; comparePrice: number | null;
  images: string[]; type: string; sellerUsername: string; sellerName: string;
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/wishlist?detailed=1")
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => setItems(Array.isArray(d.items) ? d.items : []))
      .finally(() => setLoading(false));
  }, []);

  const remove = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    await fetch(`/api/wishlist?productId=${id}`, { method: "DELETE" }).catch(() => {});
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
          <Heart className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wishlist</h1>
          <p className="text-gray-500 text-sm">Products you've saved</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-gray-200 rounded-2xl">
          <Heart className="w-10 h-10 text-gray-200 mb-4" />
          <p className="text-gray-900 font-semibold mb-1">No saved items yet</p>
          <p className="text-gray-500 text-sm">Tap the heart on any product to save it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(item => (
            <div key={item.id} className="group relative rounded-2xl border border-gray-100 bg-white overflow-hidden hover:shadow-md transition-shadow">
              <button onClick={() => remove(item.id)}
                className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-500 hover:text-red-500"
                title="Remove">
                <X className="w-3.5 h-3.5" />
              </button>
              <Link href={`/${item.sellerUsername}/store/products/${item.id}`}>
                <div className="aspect-square bg-gray-50 overflow-hidden">
                  {item.images[0]
                    ? <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    : <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-gray-200" /></div>}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.name}</p>
                  <p className="text-[11px] text-gray-400 mb-1.5">{item.sellerName || item.sellerUsername}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(item.price)}</span>
                    {item.comparePrice && <span className="text-xs line-through text-gray-400">{formatCurrency(item.comparePrice)}</span>}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
