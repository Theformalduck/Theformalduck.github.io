"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Trash2, Download, Mail, Users, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface Subscriber { id: string; email: string; createdAt: string; }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Starter email templates — pick one to pre-fill subject + body, then customize.
// Bodies are HTML (the editor + sanitizer support basic formatting).
const TEMPLATES: { id: string; name: string; subject: string; body: string }[] = [
  {
    id: "new-product",
    name: "New product",
    subject: "Just dropped: [product name]",
    body: "<div>Hey there,</div><div><br></div><div>I just added something new to the shop, <b>[product name]</b>. [Say what it is and why they'll love it.]</div><div><br></div><div>Take a look and let me know what you think!</div>",
  },
  {
    id: "sale",
    name: "Sale / discount",
    subject: "[X]% off, this week only",
    body: "<div>Hi friends,</div><div><br></div><div>For a limited time, everything in the shop is <b>[X]% off</b>. Use code <b>[CODE]</b> at checkout.</div><div><br></div><div>Don't miss it, the sale ends [date].</div>",
  },
  {
    id: "restock",
    name: "Back in stock",
    subject: "It's back: [product name]",
    body: "<div>Good news,</div><div><br></div><div><b>[product name]</b> is back in stock. It sold out fast last time, so grab yours before it's gone again.</div>",
  },
  {
    id: "update",
    name: "General update",
    subject: "What's new at [store name]",
    body: "<div>Hey everyone,</div><div><br></div><div>Here's what I've been up to lately:</div><ul><li>[Update one]</li><li>[Update two]</li><li>[Update three]</li></ul><div>Thanks for following along!</div>",
  },
  {
    id: "thanks",
    name: "Thank you",
    subject: "A quick thank you",
    body: "<div>Hi,</div><div><br></div><div>Just wanted to say <b>thank you</b> for supporting the shop, it means a lot. More good things coming soon!</div>",
  },
];

export default function SubscribersPage() {
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  // Newsletter composer
  const [composing, setComposing] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [extraEmails, setExtraEmails] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [resetKey, setResetKey] = useState(0); // remounts the editor to clear it after sending

  const load = () => {
    fetch("/api/subscribers").then(r => r.ok ? r.json() : []).then(d => setSubs(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const remove = async (id: string) => {
    setSubs(prev => prev.filter(s => s.id !== id));
    await fetch(`/api/subscribers/${id}`, { method: "DELETE" }).catch(() => {});
  };

  const extraCount = extraEmails.split(/[\s,;]+/).map(e => e.trim()).filter(e => EMAIL_RE.test(e)).length;
  const recipientCount = subs.length + extraCount;
  const messageHasContent = message.replace(/<[^>]*>/g, "").trim().length > 0;

  const send = async () => {
    if (!subject.trim() || !messageHasContent || recipientCount === 0) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/subscribers/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body: message, extraEmails }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      setResult({ ok: true, text: `Newsletter sent to ${data.queued} recipient${data.queued !== 1 ? "s" : ""}.` });
      setSubject("");
      setMessage("");
      setExtraEmails("");
      setResetKey(k => k + 1);
    } catch (e) {
      setResult({ ok: false, text: e instanceof Error ? e.message : "Failed to send" });
    } finally {
      setSending(false);
    }
  };

  // Load a template (or clear) into the composer; remount the editor to show it.
  const applyTemplate = (t?: { subject: string; body: string }) => {
    setSubject(t?.subject ?? "");
    setMessage(t?.body ?? "");
    setResetKey((k) => k + 1);
    setResult(null);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  const inputCls = "w-full px-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-nexus-500";

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/store">
            <button className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email &amp; Newsletter</h1>
            <p className="text-gray-500 text-sm">Send an email to your {subs.length} subscriber{subs.length !== 1 ? "s" : ""}, or your own list</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!composing && (
            <Button variant="lime" size="sm" onClick={() => { setComposing(true); setResult(null); }}>
              <Send className="w-4 h-4" /> New newsletter
            </Button>
          )}
          {subs.length > 0 && (
            <a href="/api/subscribers?format=csv" download>
              <Button variant="outline" size="sm" className="text-gray-700 border-gray-200"><Download className="w-4 h-4" />Export CSV</Button>
            </a>
          )}
        </div>
      </div>

      {/* Newsletter composer */}
      {composing && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Compose newsletter</h2>
            <button onClick={() => setComposing(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>

          {/* Templates */}
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Start from a template</label>
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => applyTemplate(t)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 bg-white hover:border-nexus-300 hover:text-nexus-700 transition-colors">
                {t.name}
              </button>
            ))}
            <button onClick={() => applyTemplate()}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-400 bg-white hover:text-gray-600 transition-colors">
              Blank
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mb-4">Pick one to pre-fill, then edit anything in [brackets].</p>

          <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="What's the email about?" className={`${inputCls} h-10 mb-4`} />

          <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
          <div className="mb-4">
            <RichTextEditor key={resetKey} initialHtml={message} onChange={setMessage} placeholder="Write your update, new products, a sale, an announcement…" />
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional recipients <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea value={extraEmails} onChange={e => setExtraEmails(e.target.value)} rows={2} placeholder="Add emails separated by commas or new lines"
            className={`${inputCls} py-2.5 resize-y mb-2`} />

          {result && (
            <p className={`text-sm mb-2 ${result.ok ? "text-emerald-600" : "text-red-500"}`}>{result.text}</p>
          )}

          <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
            <span className="text-xs text-gray-400">
              Sends to <span className="font-semibold text-gray-600">{recipientCount}</span> recipient{recipientCount !== 1 ? "s" : ""}
              {" "}({subs.length} subscriber{subs.length !== 1 ? "s" : ""}{extraCount ? ` + ${extraCount} added` : ""})
            </span>
            <Button variant="lime" size="sm" onClick={send} disabled={sending || !subject.trim() || !messageHasContent || recipientCount === 0}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send newsletter
            </Button>
          </div>
        </div>
      )}

      {subs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-gray-200 rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4"><Users className="w-7 h-7 text-gray-300" /></div>
          <p className="text-gray-900 font-semibold mb-1">No subscribers yet</p>
          <p className="text-gray-500 text-sm mb-5">Turn on the Newsletter section or a popup in your store customizer to start collecting emails, or send to your own list above.</p>
          <Link href="/store/customize">
            <Button variant="lime"><Mail className="w-4 h-4" /> Set up email capture</Button>
          </Link>
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
