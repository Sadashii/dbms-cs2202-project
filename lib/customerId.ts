import User from "@/models/User";

const CUSTOMER_ID_PATTERN = /^\d{10}$/;

let backfillPromise: Promise<number> | null = null;
let hasCompletedInitialBackfill = false;

export const normalizeCustomerId = (value: string) => value.replace(/\D/g, "");

export const isCustomerId = (value: string) => CUSTOMER_ID_PATTERN.test(normalizeCustomerId(value));

export async function ensureUserHasValidCustomerId(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
        return null;
    }

    const normalizedCustomerId = user.customerId ? normalizeCustomerId(user.customerId) : "";
    if (!CUSTOMER_ID_PATTERN.test(normalizedCustomerId)) {
        user.customerId = undefined as any;
        await user.save();
        return user;
    }

    if (user.customerId !== normalizedCustomerId) {
        user.customerId = normalizedCustomerId;
        await user.save();
    }

    return user;
}

export async function backfillMissingCustomerIds(): Promise<number> {
    if (hasCompletedInitialBackfill) {
        return 0;
    }

    if (backfillPromise) {
        return backfillPromise;
    }

    backfillPromise = (async () => {
        const users = await User.find({
            $or: [
                { customerId: { $exists: false } },
                { customerId: null },
                { customerId: "" },
                { customerId: { $not: CUSTOMER_ID_PATTERN } }
            ]
        }).select("_id customerId");

        for (const user of users) {
            await ensureUserHasValidCustomerId(String(user._id));
        }

        hasCompletedInitialBackfill = true;
        return users.length;
    })();

    try {
        return await backfillPromise;
    } finally {
        backfillPromise = null;
    }
}
