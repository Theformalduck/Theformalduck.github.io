"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2, MessageCircle } from "lucide-react";

interface Message {
  id: string; body: string; createdAt: string; mine: boolean;
  senderName: string; senderImage: string | null;
}

/**
 * A buyer↔seller message thread scoped to a single order. Reused on both the
 * buyer's orders page and the seller's order management view; the API decides
 * who may read/post and flags each message as `mine`.
 */
export function OrderThread({ orderId, accent = "#2e9cfe" }: { orderId: string; accent?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const load = () => {
    fetch(`/api/orders/${orderId}/messages`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setMessages(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  };

  useEffect(load, [orderId]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [messages.length]);

  const send = async () => {
    const text = body.trim();
    if (!text) return;
    setSending(true); setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      setMessages(prev => [...prev, data]);
      setBody("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/50">
      <div className="max-h-64 overflow-y-auto px-3 py-3 space-y-2">
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-5 text-center text-gray-400">
            <MessageCircle className="w-5 h-5 mb-1.5" />
            <p className="text-xs">No messages yet. Start the conversation.</p>
          </div>
        ) : (
          messages.map(m => (
            <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[75%]">
                <div className={`px-3 py-2 rounded-2xl text-sm ${m.mine ? "text-white rounded-br-sm" : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm"}`}
                  style={m.mine ? { background: accent } : undefined}>
                  {m.body}
                </div>
                <p className={`text-[10px] text-gray-400 mt-0.5 ${m.mine ? "text-right" : "text-left"}`}>
                  {m.mine ? "You" : m.senderName} · {new Date(m.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
      <div className="flex items-center gap-2 p-2 border-t border-gray-100">
        <input value={body} onChange={e => { setBody(e.target.value); setError(null); }}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Type a message…"
          className="flex-1 h-9 px-3 rounded-lg bg-white border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-nexus-500" />
        <button onClick={send} disabled={sending || !body.trim()}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-white disabled:opacity-50 flex-shrink-0"
          style={{ background: accent }}>
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-red-500 text-xs px-3 pb-2">{error}</p>}
    </div>
  );
}
