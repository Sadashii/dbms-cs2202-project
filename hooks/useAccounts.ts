import { useState, useEffect } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export interface Account {
    _id: string;
    accountNumber: string;
    accountType: string;
    balance: number;
    currency: string;
    currentStatus: string;
}

export const useAccounts = () => {
    const {
        apiFetch,
        isLoading: authLoading,
        isLoggedIn,
        user,
    } = useAuthContext();
    const router = useRouter();

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [kycs, setKycs] = useState<any[]>([]);
    const [accountRequests, setAccountRequests] = useState<any[]>([]);
    const [schedules, setSchedules] = useState<any[]>([]);

    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [isTransferring, setIsTransferring] = useState(false);
    const [transferError, setTransferError] = useState("");
    const [fromAccountId, setFromAccountId] = useState("");
    const [toAccountNumber, setToAccountNumber] = useState("");
    const [amount, setAmount] = useState("");
    const [memo, setMemo] = useState("");
    const [saveBeneficiary, setSaveBeneficiary] = useState(false);
    const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
    const [beneficiaryNickName, setBeneficiaryNickName] = useState("");
    const [isScheduled, setIsScheduled] = useState(false);
    const [frequency, setFrequency] = useState("Monthly");
    const [startDate, setStartDate] = useState("");

    const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
    const [isSubmittingKYC, setIsSubmittingKYC] = useState(false);
    const [kycStatus, setKycStatus] = useState<"idle" | "pending">("idle");
    const [newAccountType, setNewAccountType] = useState("Savings");

    const [branches, setBranches] = useState<any[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState("");

    const [isReuploadModalOpen, setIsReuploadModalOpen] = useState(false);
    const [reuploadDocType, setReuploadDocType] = useState("");

    const [panFile, setPanFile] = useState<File | null>(null);
    const [panNumber, setPanNumber] = useState("");
    const [aadharFile, setAadharFile] = useState<File | null>(null);
    const [aadharNumber, setAadharNumber] = useState("");
    const [signatureFile, setSignatureFile] = useState<File | null>(null);

    useEffect(() => {
        if (!authLoading && !isLoggedIn) router.push("/auth/login");
    }, [authLoading, isLoggedIn, router]);

    const fetchAccounts = async (p = page) => {
        try {
            setIsLoading(true);
            const res = await apiFetch(`/api/accounts?page=${p}&limit=9`);
            if (res.ok) {
                const data = await res.json();
                setAccounts(data.accounts);
                setTotalPages(data.pagination?.totalPages ?? 1);
                setTotal(data.pagination?.total ?? data.accounts.length);
                if (data.accounts.length > 0 && !fromAccountId) {
                    setFromAccountId(data.accounts[0]._id);
                }
            }
        } catch (error) {
            console.error("Failed to fetch accounts", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchKycs = async () => {
        try {
            const res = await apiFetch("/api/kyc");
            if (res.ok) {
                const data = await res.json();
                setKycs(data.documents || []);
                setAccountRequests(data.requests || []);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchBeneficiaries = async () => {
        try {
            const res = await apiFetch("/api/beneficiaries");
            if (res.ok) {
                const data = await res.json();
                setBeneficiaries(data.beneficiaries || []);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchSchedules = async () => {
        try {
            const res = await apiFetch("/api/scheduledpayments");
            if (res.ok) {
                const data = await res.json();
                setSchedules(data.schedules || []);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchBranches = async () => {
        try {
            const res = await apiFetch("/api/admin/branches");
            if (res.ok) {
                const data = await res.json();
                setBranches(data.branches || []);
            }
        } catch (e) {
            console.error("Failed to fetch branches:", e);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            fetchAccounts(page);
            fetchKycs();
            fetchBeneficiaries();
            fetchSchedules();
            fetchBranches();
        }
    }, [apiFetch, page, isLoggedIn]);

    const fetchHistory = (account: Account) => {
        router.push(`/my/accounts/${account._id}`);
    };

    const handleSaveBeneficiaryFlow = async () => {
        if (saveBeneficiary && beneficiaryNickName) {
            await apiFetch("/api/beneficiaries", {
                method: "POST",
                body: JSON.stringify({
                    nickName: beneficiaryNickName,
                    accountNumber: toAccountNumber,
                    accountName: "VaultPay User",
                }),
            });
            fetchBeneficiaries();
        }
    };

    const resetForm = (successMessage: string) => {
        setIsTransferModalOpen(false);
        setToAccountNumber("");
        setAmount("");
        setMemo("");
        setBeneficiaryNickName("");
        setSaveBeneficiary(false);
        setIsScheduled(false);
        setStartDate("");
        toast.success(successMessage);
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        setTransferError("");
        setIsTransferring(true);

        try {
            if (isScheduled) {
                const res = await apiFetch("/api/scheduledpayments", {
                    method: "POST",
                    body: JSON.stringify({
                        fromAccountId,
                        toAccountNumber,
                        amount: parseFloat(amount),
                        memo,
                        frequency,
                        startDate,
                    }),
                });
                const data = await res.json();
                if (!res.ok) {
                    setTransferError(data.message || "Scheduling failed.");
                } else {
                    await handleSaveBeneficiaryFlow();
                    resetForm("Schedule set successfully!");
                    fetchSchedules();
                }
            } else {
                const res = await apiFetch("/api/transactions", {
                    method: "POST",
                    body: JSON.stringify({
                        fromAccountId,
                        toAccountNumber,
                        amount: parseFloat(amount),
                        memo,
                    }),
                });
                const data = await res.json();
                if (!res.ok) {
                    setTransferError(data.message || "Transfer failed.");
                } else {
                    await handleSaveBeneficiaryFlow();
                    resetForm(
                        `Transfer Successful! Ref ID: ${data.referenceId}`,
                    );
                    fetchAccounts();
                }
            }
        } catch {
            setTransferError("A network error occurred. Please try again.");
        } finally {
            setIsTransferring(false);
        }
    };

    const updateScheduleStatus = async (
        scheduleId: string,
        currentStatus: string,
    ) => {
        try {
            const res = await apiFetch("/api/scheduledpayments", {
                method: "PATCH",
                body: JSON.stringify({ scheduleId, currentStatus }),
            });
            if (res.ok) {
                toast.success(
                    `Schedule ${currentStatus.toLowerCase()} successfully.`,
                );
                fetchSchedules();
            }
        } catch {
            toast.error("Failed to update schedule status.");
        }
    };

    const handleRequestAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!panFile && !signatureFile && !aadharFile) {
            toast.error("Please upload the documents you wish to submit.");
            return;
        }

        setIsSubmittingKYC(true);

        try {
            const formData = new FormData();
            formData.append("accountType", newAccountType);
            formData.append("panNumber", panNumber);
            formData.append("aadharNumber", aadharNumber);
            if (selectedBranchId) formData.append("branchId", selectedBranchId);
            if (panFile) formData.append("panCard", panFile);
            if (aadharFile) formData.append("aadhar", aadharFile);
            if (signatureFile) formData.append("signature", signatureFile);

            const response = await apiFetch("/api/account-requests", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.message || "Failed to submit request",
                );
            }

            toast.success("Registration submitted successfully.");
            setKycStatus("pending");
            fetchKycs();
        } catch (error: any) {
            console.error("Failed to submit KYC:", error);
            toast.error(error.message || "Failed to submit account request.");
        } finally {
            setIsSubmittingKYC(false);
        }
    };

    const handleWithdrawRequest = async (requestId: string) => {
        if (!confirm("Are you sure you want to withdraw this account request?"))
            return;
        try {
            const res = await apiFetch(
                `/api/account-requests?id=${requestId}`,
                {
                    method: "DELETE",
                },
            );
            if (res.ok) {
                toast.success("Account request withdrawn.");
                fetchKycs();
            } else {
                const data = await res.json();
                toast.error(data.message || "Failed to withdraw request.");
            }
        } catch {
            toast.error("A network error occurred.");
        }
    };

    const closeKycModal = () => {
        if (!isSubmittingKYC) {
            setIsNewAccountModalOpen(false);
            setTimeout(() => setKycStatus("idle"), 300);
            setPanFile(null);
            setAadharFile(null);
            setSignatureFile(null);
            setPanNumber("");
            setAadharNumber("");
        }
    };

    return {
        user,
        isLoading,
        authLoading,
        accounts,
        page,
        setPage,
        totalPages,
        total,
        kycs,
        accountRequests,
        schedules,
        branches,
        beneficiaries,
        isTransferModalOpen,
        setIsTransferModalOpen,
        isTransferring,
        transferError,
        fromAccountId,
        setFromAccountId,
        toAccountNumber,
        setToAccountNumber,
        amount,
        setAmount,
        memo,
        setMemo,
        saveBeneficiary,
        setSaveBeneficiary,
        beneficiaryNickName,
        setBeneficiaryNickName,
        isScheduled,
        setIsScheduled,
        frequency,
        setFrequency,
        startDate,
        setStartDate,
        isNewAccountModalOpen,
        setIsNewAccountModalOpen,
        isSubmittingKYC,
        kycStatus,
        newAccountType,
        setNewAccountType,
        selectedBranchId,
        setSelectedBranchId,
        isReuploadModalOpen,
        setIsReuploadModalOpen,
        reuploadDocType,
        setReuploadDocType,
        panFile,
        setPanFile,
        panNumber,
        setPanNumber,
        aadharFile,
        setAadharFile,
        aadharNumber,
        setAadharNumber,
        signatureFile,
        setSignatureFile,
        fetchAccounts,
        fetchKycs,
        fetchSchedules,
        fetchHistory,
        handleTransfer,
        updateScheduleStatus,
        handleRequestAccount,
        handleWithdrawRequest,
        closeKycModal,
        router,
    };
};
