"use client";

import { useEffect, useRef } from "react";

// LocalStorage keys (device-specific, since browser permission is per-device).
export const BROWSER_ALERTS_KEY = "sellora:browserAlerts";
export const SOUND_ALERTS_KEY = "sellora:soundAlerts";

interface Notif { id: string; title: string; body: string | null; createdAt: string; }

// ── Sound ─────────────────────────────────────────────────────────────────────
// A short two-note chime synthesized with the Web Audio API (no asset to ship).
// The context is unlocked on the first user interaction so it can play even when
// the tab is later in the background.
let audioCtx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as any).webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  return audioCtx;
}
export function playChime() {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const now = ctx.currentTime;
  [880, 1175].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = now + i * 0.16;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.24);
  });
}

/**
 * Background watcher: polls for new notifications and, when the user has enabled
 * real alerts and is on another tab, raises a native browser notification plus a
 * chime. Mounted once in the dashboard layout. Emails are handled server-side.
 */
export function NotificationAlerts() {
  const seen = useRef<Set<string>>(new Set());
  const primed = useRef(false);

  useEffect(() => {
    // Unlock audio on the first interaction so the chime can play in background.
    const unlock = () => { getCtx()?.resume().catch(() => {}); };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    let stopped = false;

    const poll = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const list: Notif[] = await res.json();
        if (!Array.isArray(list)) return;

        // First run: record what already exists so we don't alert on history.
        if (!primed.current) {
          list.forEach((n) => seen.current.add(n.id));
          primed.current = true;
          return;
        }

        const fresh = list.filter((n) => !seen.current.has(n.id));
        fresh.forEach((n) => seen.current.add(n.id));
        if (fresh.length === 0) return;

        // Only alert when the user is looking at another tab/window.
        if (!document.hidden) return;

        const browserOn = localStorage.getItem(BROWSER_ALERTS_KEY) === "1";
        const soundOn = localStorage.getItem(SOUND_ALERTS_KEY) !== "0"; // default on
        if (!browserOn) return;

        if (soundOn) playChime();

        if ("Notification" in window && Notification.permission === "granted") {
          // Show the newest; summarize if several arrived at once.
          const top = fresh[0];
          const title = fresh.length > 1 ? `${fresh.length} new notifications` : top.title;
          const body = fresh.length > 1 ? top.title : (top.body ?? "");
          const note = new Notification(title, { body, icon: "/favicon.ico", tag: "sellora-activity" });
          note.onclick = () => { window.focus(); note.close(); };
        }
      } catch {
        /* network hiccup — try again next tick */
      }
    };

    poll();
    const id = setInterval(() => { if (!stopped) poll(); }, 25_000);
    return () => {
      stopped = true;
      clearInterval(id);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  return null;
}
