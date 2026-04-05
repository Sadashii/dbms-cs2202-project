import { Types } from "mongoose";

/**
 * Convert a Mongoose Decimal128 field to a regular JS number for JSON serialization.
 * Always use this instead of ad-hoc .toString() calls in API routes.
 */
export const dec128ToNumber = (d: Types.Decimal128 | undefined | null): number => {
    if (!d) return 0;
    return parseFloat(d.toString());
};

/**
 * Format a number as currency (Indian locale by default).
 */
export const formatCurrency = (
    amount: number,
    currency: string = "INR",
    locale: string = "en-IN"
): string => {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
};
