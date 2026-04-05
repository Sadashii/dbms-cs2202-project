/**
 * Simple in-memory rate limiter for Next.js API routes.
 * For production, replace with Redis-backed rate limiting (e.g., @upstash/ratelimit).
 *
 * Usage:
 *   const allowed = checkRateLimit(ip, 'login', 5, 15 * 60 * 1000); // 5 attempts per 15 min
 *   if (!allowed) return NextResponse.json({ message: "Too many attempts, try again later." }, { status: 429 });
 */

interface RateLimitRecord {
    count: number;
    resetAt: number;
}

// In-memory store — shared across requests in the same Node.js process
const store = new Map<string, RateLimitRecord>();

// Clean up expired entries every 5 minutes to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
        if (record.resetAt < now) {
            store.delete(key);
        }
    }
}, 5 * 60 * 1000);

/**
 * @param identifier - Unique key per user/IP (e.g., `${ip}:login`)
 * @param action     - Action name, used to namespace the key
 * @param limit      - Max number of requests allowed in the window
 * @param windowMs   - Time window in milliseconds
 * @returns true if the request is allowed, false if rate limit exceeded
 */
export function checkRateLimit(
    identifier: string,
    action: string,
    limit: number,
    windowMs: number
): boolean {
    const key = `${action}:${identifier}`;
    const now = Date.now();
    const record = store.get(key);

    if (!record || record.resetAt < now) {
        // First request in this window
        store.set(key, { count: 1, resetAt: now + windowMs });
        return true;
    }

    if (record.count >= limit) {
        return false; // Rate limit exceeded
    }

    record.count++;
    return true;
}
