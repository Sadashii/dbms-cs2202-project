interface RateLimitRecord {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

setInterval(
    () => {
        const now = Date.now();
        for (const [key, record] of store.entries()) {
            if (record.resetAt < now) {
                store.delete(key);
            }
        }
    },
    5 * 60 * 1000,
);

export function checkRateLimit(
    identifier: string,
    action: string,
    limit: number,
    windowMs: number,
): boolean {
    const key = `${action}:${identifier}`;
    const now = Date.now();
    const record = store.get(key);

    if (!record || record.resetAt < now) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return true;
    }

    if (record.count >= limit) {
        return false;
    }

    record.count++;
    return true;
}
