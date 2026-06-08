"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Trash2, Download, Mail, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Subscriber { id: string; email: string; createdAt: string; }

export default function SubscribersPage() {
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/subscribers").then(r => r.ok ? r.json() : []).then(d => setSubs(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const remove = async (id: string) => {
    setSubs(prev => prev.filter(s => s.id !== id));
    await fetch(`/api/subscribers/${id}`, { method: "DELETE" }).catch(() => {});
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
            <h1 className="text-2xl font-bold text-gray-900">Subscribers</h1>
            <p className="text-gray-500 text-sm">{subs.length} email{subs.length !== 1 ? "s" : ""} collected from your store</p>
          </div>
        </div>
        {subs.length > 0 && (
          <a href="/api/subscribers?format=csv" download>
            <Button variant="outline" size="sm" className="text-gray-700 border-gray-200"><Download className="w-4 h-4" />Export CSV</Button>
          </a>
        )}
      </div>

      {subs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-gray-200 rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4"><Users className="w-7 h-7 text-gray-300" /></div>
          <p className="text-gray-900 font-semibold mb-1">No subscribers yet</p>
          <p className="text-gray-500 text-sm">Enable the Newsletter section or a popup in your store customizer to start collecting emails.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
          {subs.map(s => (
            <div key={s.id} className="flex items-center gap-3 px-5 py-3.5">
              <div className="w-8 h-8 rounded-lg bg-nexus-50 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-[#2e9cfe]" />
              </div>
              <span className="text-sm text-gray-900 flex-1 truncate">{s.email}</span>
              <span className="text-xs text-gray-400 hidden sm:block">{new Date(s.createdAt).toLocaleDateString()}</span>
              <button onClick={() => remove(s.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50" title="Remove">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
