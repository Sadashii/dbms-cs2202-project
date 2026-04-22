import { useState } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import toast from "react-hot-toast";

export const useAdminTransactions = (type: "deposit" | "withdrawal") => {
    const { apiFetch } = useAuthContext();
    const [step, setStep] = useState<1 | 2>(1);
    const [accountNumber, setAccountNumber] = useState("");
    const [accountDetails, setAccountDetails] = useState<any>(null);
    const [amount, setAmount] = useState("");
    const [memo, setMemo] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleVerifyAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accountNumber.trim()) {
            toast.error("Account Number is required.");
            return;
        }

        setIsLoading(true);
        const loadingToast = toast.loading("Verifying account...");

        try {
            const response = await apiFetch(
                `/api/admin/accounts/${accountNumber.trim()}`,
            );
            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || "Account not found.", {
                    id: loadingToast,
                });
                return;
            }

            if (data.account.currentStatus !== "Active") {
                toast.error("Account is not active.", { id: loadingToast });
                return;
            }

            setAccountDetails(data.account);
            toast.success("Identity Verified.", { id: loadingToast });
            setStep(2);
        } catch (error: any) {
            toast.error("Verification failed.", { id: loadingToast });
        } finally {
            setIsLoading(false);
        }
    };

    const handleExecute = async (e: React.FormEvent) => {
        e.preventDefault();
        const parsedAmount = parseFloat(amount);

        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            toast.error("Invalid amount.");
            return;
        }

        if (
            type === "withdrawal" &&
            accountDetails &&
            parsedAmount > accountDetails.balance
        ) {
            toast.error(`Insufficient funds. Max: ${accountDetails.balance}`);
            return;
        }

        setIsLoading(true);
        const loadingToast = toast.loading(`Processing ${type}...`);

        try {
            const response = await apiFetch("/api/admin/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: type,
                    accountNumber: accountNumber.trim(),
                    amount: parsedAmount.toString(),
                    memo: memo.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || "Transaction failed.", {
                    id: loadingToast,
                });
                return;
            }

            toast.success(
                `${type === "deposit" ? "Credit" : "Debit"} authorized! New Balance: ${data.newBalance}`,
                {
                    id: loadingToast,
                },
            );
            reset();
        } catch (error: any) {
            toast.error("Unexpected error occurred.", { id: loadingToast });
        } finally {
            setIsLoading(false);
        }
    };

    const reset = () => {
        setAccountNumber("");
        setAccountDetails(null);
        setAmount("");
        setMemo("");
        setStep(1);
    };

    return {
        step,
        setStep,
        accountNumber,
        setAccountNumber,
        accountDetails,
        amount,
        setAmount,
        memo,
        setMemo,
        isLoading,
        handleVerifyAccount,
        handleExecute,
        reset,
    };
};
