// ── Structured logger ──────────────────────────────────────────────────────────
// Emits one JSON object per line so logs are queryable in any aggregator
// (Vercel, Datadog, Better Stack, Sentry, etc.). Use instead of bare console.*.

type Level = "debug" | "info" | "warn" | "error";
const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN =
  LEVELS[(process.env.LOG_LEVEL as Level) ?? (process.env.NODE_ENV === "production" ? "info" : "debug")] ?? 20;

function emit(level: Level, msg: string, ctx?: Record<string, unknown>) {
  if (LEVELS[level] < MIN) return;
  const line = JSON.stringify({ level, msg, time: new Date().toISOString(), ...(ctx ?? {}) });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  debug: (msg: string, ctx?: Record<string, unknown>) => emit("debug", msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => emit("info", msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => emit("warn", msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => emit("error", msg, ctx),
};

// Capture an error for monitoring: structured-logs it (always) and forwards it
// to an external monitor when one is wired in. To enable Sentry: `npm i
// @sentry/nextjs`, set SENTRY_DSN, init it in instrumentation.ts, and call
// Sentry.captureException(error) from here.
export function captureError(error: unknown, ctx?: Record<string, unknown>) {
  const e = error instanceof Error ? error : new Error(String(error));
  emit("error", e.message, { ...(ctx ?? {}), errorName: e.name, stack: e.stack });
}
