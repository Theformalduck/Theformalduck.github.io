import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// ── Upstash Redis rate limiter (production) ───────────────────────────────────
// Falls back to in-memory when UPSTASH_REDIS_REST_URL is not set (local dev).

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

let redis: Redis | null = null;
if (hasUpstash) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

// Cache of Ratelimit instances keyed by "limit:windowMs"
const limiterCache = new Map<string, Ratelimit>();

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit {
  const key = `${limit}:${windowMs}`;
  if (!limiterCache.has(key)) {
    limiterCache.set(
      key,
      new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(limit, `${windowMs}ms`),
        analytics: false,
      })
    );
  }
  return limiterCache.get(key)!;
}

// ── In-memory fallback (single-instance / local dev) ─────────────────────────

interface RateLimitEntry { count: number; resetAt: number }
const memStore = new Map<string, RateLimitEntry>();
setInterval(() => {
  const now = Date.now();
  for (const [k, e] of memStore) if (e.resetAt <= now) memStore.delete(k);
}, 5 * 60 * 1000);

function memRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = memStore.get(key);
  if (!entry || entry.resetAt <= now) {
    memStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  if (entry.count >= limit) return { allowed: false, remaining: 0 };
  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number }> {
  if (!hasUpstash) return memRateLimit(key, limit, windowMs);

  try {
    const limiter = getUpstashLimiter(limit, windowMs);
    const { success, remaining } = await limiter.limit(key);
    return { allowed: success, remaining };
  } catch {
    // If Redis is unreachable, fail open (allow the request) to avoid blocking users
    console.warn("[rate-limit] Upstash unavailable, failing open");
    return { allowed: true, remaining: limit };
  }
}

export function getIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
