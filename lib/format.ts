import { Types } from "mongoose";

export const dec128ToNumber = (
    d: Types.Decimal128 | undefined | null,
): number => {
    if (!d) return 0;
    return parseFloat(d.toString());
};

export const formatCurrency = (
    amount: number,
    currency: string = "INR",
    locale: string = "en-IN",
): string => {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
};
