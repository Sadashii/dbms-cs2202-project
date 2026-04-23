import { NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@/lib/mongodb";
import Account from "@/models/Accounts";
import Loan from "@/models/Loans";
import Card from "@/models/Cards";
import Ledger from "@/models/Ledger";
import Transaction from "@/models/Transactions";
import { verifyAuth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

type DecimalLike = { toString(): string };

type LoanSummary = {
    principalAmount?: DecimalLike;
    remainingAmount?: DecimalLike;
    emiAmount?: DecimalLike;
    nextPaymentDate?: string | Date;
    loanType?: string;
} & Record<string, unknown>;

type LedgerSummary = {
    amount?: DecimalLike;
    balanceAfter?: DecimalLike;
} & Record<string, unknown>;

const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

export async function GET() {
    try {
        const reqHeaders = await headers();
        const ip =
            reqHeaders.get("x-forwarded-for") ??
            reqHeaders.get("x-real-ip") ??
            "unknown";
        if (!checkRateLimit(ip, "dashboard", 100, 15 * 60 * 1000)) {
            return NextResponse.json(
                {
                    message:
                        "Too many requests. Please try again in 15 minutes.",
                },
                { status: 429 },
            );
        }

        const decoded = verifyAuth(reqHeaders);
        if (!decoded) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 },
            );
        }

        await dbConnect();

        Transaction.init();

        const userId = decoded.userId;

        const [accounts, loans, cards] = await Promise.all([
            Account.find({ userId })
                .select(
                    "accountNumber accountType balance currency currentStatus",
                )
                .lean(),
            Loan.find({
                userId,
                currentStatus: {
                    $in: ["Applied", "Approved", "Active", "Disbursed"],
                },
            })
                .select(
                    "loanType principalAmount remainingAmount emiAmount currentStatus nextPaymentDate",
                )
                .lean(),
            Card.find({
                userId,
                currentStatus: { $in: ["Active", "Frozen", "Blocked"] },
            })
                .select("cardType cardNetwork maskedNumber currentStatus")
                .lean(),
        ]);

        const accountIds = accounts.map((a) => a._id);

        const recentTransactions = await Ledger.find({
            accountId: { $in: accountIds },
        })
            .populate("transactionId", "referenceId type currentStatus")
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        const formattedAccounts = accounts.map((acc) => ({
            ...acc,
            balance: acc.balance ? parseFloat(acc.balance.toString()) : 0,
        }));

        const formattedLoans = loans.map((rawLoan) => {
            const loan = rawLoan as LoanSummary;

            return {
                ...loan,
                principalAmount: loan.principalAmount
                    ? parseFloat(loan.principalAmount.toString())
                    : 0,
                remainingAmount: loan.remainingAmount
                    ? parseFloat(loan.remainingAmount.toString())
                    : 0,
                emiAmount: loan.emiAmount
                    ? parseFloat(loan.emiAmount.toString())
                    : 0,
            };
        });

        const formattedTransactions = recentTransactions.map(
            (rawTransaction) => {
                const transaction = rawTransaction as LedgerSummary;

                return {
                    ...transaction,
                    amount: transaction.amount
                        ? parseFloat(transaction.amount.toString())
                        : 0,
                    balanceAfter: transaction.balanceAfter
                        ? parseFloat(transaction.balanceAfter.toString())
                        : 0,
                };
            },
        );

        const totalBalance = formattedAccounts.reduce(
            (sum, a) => sum + a.balance,
            0,
        );
        const totalLoanOutstanding = formattedLoans.reduce(
            (sum, l) => sum + l.remainingAmount,
            0,
        );
        const nextEmiDue = formattedLoans
            .filter((l) => l.nextPaymentDate)
            .sort(
                (a, b) =>
                    new Date(a.nextPaymentDate).getTime() -
                    new Date(b.nextPaymentDate).getTime(),
            )[0];

        return NextResponse.json({
            summary: {
                totalBalance,
                activeAccountsCount: formattedAccounts.filter(
                    (a) => a.currentStatus === "Active",
                ).length,
                totalLoanOutstanding,
                activeLoansCount: formattedLoans.length,
                activeCardsCount: cards.filter(
                    (c) => c.currentStatus === "Active",
                ).length,
                nextEmiDue: nextEmiDue
                    ? {
                          amount: nextEmiDue.emiAmount,
                          date: nextEmiDue.nextPaymentDate,
                          type: nextEmiDue.loanType,
                      }
                    : null,
            },
            accounts: formattedAccounts,
            loans: formattedLoans,
            cards,
            recentTransactions: formattedTransactions,
        });
    } catch (error: unknown) {
        console.error("Dashboard API Error:", error);
        return NextResponse.json(
            { message: getErrorMessage(error, "Internal server error.") },
            { status: 500 },
        );
    }
}
