/**
 * Simple sliding-window rate limiter (in-memory / per serverless isolate).
 * Enough to blunt casual abuse of expensive DashScope calls.
 */

type Bucket = { timestamps: number[] };

const globalBuckets = globalThis as typeof globalThis & {
  __detectrRateLimit?: Map<string, Bucket>;
};

const buckets =
  globalBuckets.__detectrRateLimit ?? new Map<string, Bucket>();
globalBuckets.__detectrRateLimit = buckets;

export type RateLimitResult =
  | { ok: true; remaining: number; limit: number; resetMs: number }
  | {
      ok: false;
      remaining: number;
      limit: number;
      resetMs: number;
      retryAfterSec: number;
    };

export function clientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

/**
 * Allow at most `limit` hits in `windowMs` for `key`.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0] ?? now;
    const resetMs = Math.max(0, windowMs - (now - oldest));
    buckets.set(key, bucket);
    return {
      ok: false,
      remaining: 0,
      limit,
      resetMs,
      retryAfterSec: Math.max(1, Math.ceil(resetMs / 1000)),
    };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  const oldest = bucket.timestamps[0] ?? now;
  return {
    ok: true,
    remaining: Math.max(0, limit - bucket.timestamps.length),
    limit,
    resetMs: Math.max(0, windowMs - (now - oldest)),
  };
}

/** Presets for Detectr routes (override via env). */
export const RATE = {
  analyze: {
    limit: Number(process.env.RATE_LIMIT_ANALYZE ?? 3),
    windowMs: Number(process.env.RATE_LIMIT_ANALYZE_WINDOW_MS ?? 15 * 60_000),
  },
  detective: {
    limit: Number(process.env.RATE_LIMIT_DETECTIVE ?? 20),
    windowMs: Number(process.env.RATE_LIMIT_DETECTIVE_WINDOW_MS ?? 10 * 60_000),
  },
  demo: {
    limit: Number(process.env.RATE_LIMIT_DEMO ?? 60),
    windowMs: Number(process.env.RATE_LIMIT_DEMO_WINDOW_MS ?? 10 * 60_000),
  },
} as const;

export function rateLimitResponse(result: Extract<RateLimitResult, { ok: false }>) {
  return new Response(
    JSON.stringify({
      error: "Too many requests. Slow down and try again later.",
      retryAfterSec: result.retryAfterSec,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSec),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil((Date.now() + result.resetMs) / 1000)),
      },
    },
  );
}
