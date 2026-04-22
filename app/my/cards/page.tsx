"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

interface Card {
    _id: string;
    cardType: string;
    cardNetwork: string;
    maskedNumber: string;
    expiryDate: string;
    currentStatus: string;
    currency: string;
    accountId: string;
    isOnlineEnabled: boolean;
    isInternationalEnabled: boolean;
    limits: {
        dailyWithdrawalLimit: number;
        dailyOnlineLimit: number;
        contactlessLimit: number;
        outstandingAmount?: number;
        creditLimit?: number;
    };
}

interface Account {
    _id: string;
    accountNumber: string;
    accountType: string;
    balance: number;
}

interface CardTransaction {
    _id: string;
    entryType: "Debit" | "Credit";
    amount: number;
    balanceAfter: number;
    memo: string;
    createdAt: string;
    transaction: {
        referenceId: string;
        type: string;
        currentStatus: string;
    };
}

export default function EnhancedCardsPage() {
    const {
        apiFetch,
        user,
        isLoading: authLoading,
        isLoggedIn,
    } = useAuthContext();
    const router = useRouter();
    const [cards, setCards] = useState<Card[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Selection
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);
    const [activeTab, setActiveTab] = useState<
        "controls" | "transactions" | "analytics"
    >("controls");

    const [flippedCardId, setFlippedCardId] = useState<string | null>(null);

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [cardTransactions, setCardTransactions] = useState<CardTransaction[]>(
        [],
    );
    const [isTransactionsLoading, setIsTransactionsLoading] = useState(false);

    const [isUpdatingFeature, setIsUpdatingFeature] = useState(false);

    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);

    const [isGenerating, setIsGenerating] = useState(false);
    const [isSubmittingLimits, setIsSubmittingLimits] = useState(false);
    const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
    const [isSubmittingRepay, setIsSubmittingRepay] = useState(false);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [isSubmittingPin, setIsSubmittingPin] = useState(false);
    const [newPin, setNewPin] = useState("");

    const [newCardType, setNewCardType] = useState("Debit");
    const [newCardNetwork, setNewCardNetwork] = useState("Visa");
    const [linkAccountId, setLinkAccountId] = useState("");
    const [newCreditLimit, setNewCreditLimit] = useState("50000");

    const [onlineLimit, setOnlineLimit] = useState("");
    const [atmLimit, setAtmLimit] = useState("");
    const [contactlessLimit, setContactlessLimit] = useState("");

    const [expenseAmount, setExpenseAmount] = useState("");
    const [expenseMerchant, setExpenseMerchant] = useState("");
    const [isOnlineExpense, setIsOnlineExpense] = useState(false);
    const [isInternationalExpense, setIsInternationalExpense] = useState(false);
    const [isContactlessExpense, setIsContactlessExpense] = useState(false);
    const [isATMExpense, setIsATMExpense] = useState(false);

    const [repayAmount, setRepayAmount] = useState("");
    const [repaySourceAccountId, setRepaySourceAccountId] = useState("");

    // Redirect unauthenticated users
    useEffect(() => {
        if (!authLoading && !isLoggedIn) router.push("/auth/login");
    }, [authLoading, isLoggedIn, router]);

    const fetchCards = async (autoSelectLatest = false) => {
        try {
            setIsLoading(true);
            const res = await apiFetch("/api/cards");
            if (res.ok) {
                const data = await res.json();
                const validCards = data.cards || [];

                setCards(validCards);

                if (validCards.length > 0) {
                    if (autoSelectLatest) {
                        setSelectedCard(validCards[validCards.length - 1]);
                    } else if (
                        !selectedCard ||
                        !validCards.find(
                            (c: Card) => c._id === selectedCard._id,
                        )
                    ) {
                        setSelectedCard(validCards[0]);
                    } else {
                        const updatedSelected = validCards.find(
                            (c: Card) => c._id === selectedCard._id,
                        );
                        if (updatedSelected) setSelectedCard(updatedSelected);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch cards", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAccounts = async () => {
        try {
            const res = await apiFetch("/api/accounts");
            if (res.ok) {
                const data = await res.json();
                setAccounts(data.accounts || []);
                if (data.accounts?.length > 0) {
                    setLinkAccountId(data.accounts[0]._id);
                    setRepaySourceAccountId(data.accounts[0]._id);
                }
            }
        } catch (error) {
            console.error("Failed to fetch accounts", error);
        }
    };

    const fetchCardTransactions = async (cardId: string) => {
        try {
            setIsTransactionsLoading(true);
            const res = await apiFetch(`/api/cards/${cardId}/transactions`);
            if (res.ok) {
                const data = await res.json();
                setCardTransactions(data.transactions || []);
            }
        } catch (error) {
            console.error("Failed to fetch card transactions", error);
        } finally {
            setIsTransactionsLoading(false);
        }
    };

    useEffect(() => {
        fetchCards();
        fetchAccounts();
    }, [apiFetch]);

    useEffect(() => {
        if (selectedCard && activeTab === "transactions") {
            fetchCardTransactions(selectedCard._id);
        }
    }, [selectedCard, activeTab]);

    const handleCardClick = (card: Card) => {
        if (selectedCard?._id === card._id) {
            setFlippedCardId((prev) => (prev === card._id ? null : card._id));
        } else {
            setSelectedCard(card);
            setFlippedCardId(null);
        }
    };

    const handleRequestCard = async () => {
        setIsGenerating(true);
        try {
            const res = await apiFetch("/api/cards", {
                method: "POST",
                body: JSON.stringify({
                    cardType: newCardType,
                    cardNetwork: newCardNetwork,
                    accountId:
                        newCardType === "Debit" ? linkAccountId : undefined,
                    creditLimit:
                        newCardType === "Credit"
                            ? parseFloat(newCreditLimit)
                            : undefined,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                setIsRequestModalOpen(false);
                await fetchCards(true);
            } else {
                toast.error(
                    `Server Error: ${data.message || "Unknown error occurred"}`,
                );
            }
        } catch (error: any) {
            toast.error(`Network Error: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleUpdateLimits = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCard) return;

        setIsSubmittingLimits(true);
        try {
            const res = await apiFetch("/api/cards", {
                method: "PATCH",
                body: JSON.stringify({
                    cardId: selectedCard._id,
                    action: "UPDATE_LIMITS",
                    data: {
                        onlineLimit: parseFloat(onlineLimit),
                        atmLimit: parseFloat(atmLimit),
                        contactlessLimit: parseFloat(contactlessLimit),
                    },
                }),
            });

            if (res.ok) {
                setIsLimitModalOpen(false);
                await fetchCards();
            } else {
                toast.error("Failed to update limits.");
            }
        } catch (error) {
            console.error("Limit update failed", error);
        } finally {
            setIsSubmittingLimits(false);
        }
    };

    const handleUpdatePin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCard) return;

        setIsSubmittingPin(true);
        try {
            const res = await apiFetch("/api/cards", {
                method: "PATCH",
                body: JSON.stringify({
                    cardId: selectedCard._id,
                    action: "CHANGE_PIN",
                    value: newPin,
                }),
            });

            if (res.ok) {
                toast.success("PIN updated successfully.");
                setIsPinModalOpen(false);
                setNewPin("");
            } else {
                const d = await res.json();
                toast.error(d.message || "Failed to update PIN.");
            }
        } catch (error) {
            toast.error("Failed to update PIN.");
        } finally {
            setIsSubmittingPin(false);
        }
    };

    const openLimitModal = (card: Card) => {
        setSelectedCard(card);
        setOnlineLimit(card.limits?.dailyOnlineLimit?.toString() || "100000");
        setAtmLimit(card.limits?.dailyWithdrawalLimit?.toString() || "50000");
        setContactlessLimit(
            card.limits?.contactlessLimit?.toString() || "5000",
        );
        setIsLimitModalOpen(true);
    };

    const handleToggleStatus = async (
        cardId: string,
        currentStatus: string,
    ) => {
        const action = currentStatus === "Active" ? "Freeze" : "Unfreeze";
        if (!confirm(`Are you sure you want to ${action} this card?`)) return;

        try {
            const res = await apiFetch("/api/cards", {
                method: "PATCH",
                body: JSON.stringify({ cardId, action: "TOGGLE_STATUS" }),
            });
            if (res.ok) fetchCards();
        } catch (error) {
            console.error("Status update failed", error);
        }
    };

    const handleToggleFeature = async (feature: "online" | "international") => {
        if (!selectedCard || isUpdatingFeature) return;

        setIsUpdatingFeature(true);
        try {
            const res = await apiFetch("/api/cards", {
                method: "PATCH",
                body: JSON.stringify({
                    cardId: selectedCard._id,
                    action: "TOGGLE_FEATURE",
                    data: { feature },
                }),
            });
            if (res.ok) {
                await fetchCards();
                toast.success(
                    `${feature.charAt(0).toUpperCase() + feature.slice(1)} setting updated.`,
                );
            } else {
                toast.error("Failed to update feature.");
            }
        } catch (error) {
            console.error("Feature toggle failed", error);
        } finally {
            setIsUpdatingFeature(false);
        }
    };

    const handleDeleteCard = async (cardId: string) => {
        const cardToDelete = cards.find((c) => c._id === cardId);
        if (!cardToDelete) return;

        if (cardToDelete.currentStatus !== "Blocked") {
            toast.error("Card must be Frozen before it can be deleted.");
            return;
        }

        if (
            cardToDelete.cardType === "Credit" &&
            (cardToDelete.limits?.outstandingAmount || 0) > 0
        ) {
            toast.error(
                "Credit cards must have zero outstanding balance before deletion.",
            );
            return;
        }

        if (!confirm("Are you sure you want to permanently delete this card?"))
            return;

        try {
            const res = await apiFetch("/api/cards", {
                method: "PATCH",
                body: JSON.stringify({ cardId, action: "DELETE_CARD" }),
            });
            if (res.ok) {
                toast.success("Card deleted successfully.");
                fetchCards();
            } else {
                toast.error("Failed to delete card.");
            }
        } catch (error) {
            console.error("Deletion failed", error);
        }
    };

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCard) return;
        setIsSubmittingExpense(true);
        try {
            const res = await apiFetch("/api/cards/expense", {
                method: "POST",
                body: JSON.stringify({
                    cardId: selectedCard._id,
                    amount: parseFloat(expenseAmount),
                    merchant: expenseMerchant,
                    isOnline: isOnlineExpense,
                    isInternational: isInternationalExpense,
                    isContactless: isContactlessExpense,
                    isATM: isATMExpense,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Expense simulated!");
                setIsExpenseModalOpen(false);
                setExpenseAmount("");
                setExpenseMerchant("");
                fetchCards();
                if (activeTab === "transactions")
                    fetchCardTransactions(selectedCard._id);
            } else {
                toast.error(data.message || "Failed to create expense.");
            }
        } catch (error) {
            console.error("Expense failed", error);
        } finally {
            setIsSubmittingExpense(false);
        }
    };

    const handleRepayCreditCard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCard) return;
        setIsSubmittingRepay(true);
        try {
            const res = await apiFetch("/api/cards/repay", {
                method: "POST",
                body: JSON.stringify({
                    cardId: selectedCard._id,
                    accountId: repaySourceAccountId,
                    amount: parseFloat(repayAmount),
                }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Repayment successful!");
                setIsRepayModalOpen(false);
                setRepayAmount("");
                fetchCards();
                if (activeTab === "transactions")
                    fetchCardTransactions(selectedCard._id);
            } else {
                toast.error(data.message || "Repayment failed.");
            }
        } catch (error) {
            console.error("Repayment failed", error);
        } finally {
            setIsSubmittingRepay(false);
        }
    };

    const filteredCards = cards.filter(
        (c) =>
            c.currentStatus !== "Closed" &&
            (c.maskedNumber.includes(searchQuery) ||
                c.cardNetwork
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())),
    );

    const debitCards = filteredCards.filter((c) => c.cardType === "Debit");
    const creditCards = filteredCards.filter((c) => c.cardType === "Credit");
    const virtualCards = filteredCards.filter((c) => c.cardType === "Virtual");

    const getCardStyle = (
        type: string,
        network: string,
        isBlocked: boolean,
    ) => {
        if (isBlocked) return "bg-gray-800 opacity-75 grayscale";
        if (type === "Virtual")
            return "bg-gradient-to-tr from-cyan-900 via-teal-900 to-emerald-950 text-cyan-50 border border-cyan-800/50";
        if (type === "Credit") {
            if (network === "Amex")
                return "bg-gradient-to-br from-slate-800 via-gray-900 to-black text-amber-50";
            return "bg-gradient-to-tr from-purple-900 via-indigo-900 to-slate-900 text-white";
        } else {
            if (network === "MasterCard")
                return "bg-gradient-to-br from-orange-600 to-red-600 text-white";
            if (network === "RuPay")
                return "bg-gradient-to-br from-teal-600 to-emerald-800 text-white";
            return "bg-gradient-to-br from-blue-600 to-cyan-700 text-white";
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in transition-colors">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">
                        My Cards
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 transition-colors">
                        Manage your Debit and Credit limits and features.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="primary"
                        onClick={() => setIsRequestModalOpen(true)}
                        className="shadow-md"
                    >
                        + New Card
                    </Button>
                </div>
            </header>

            {isLoading ? (
                <div className="py-20 flex justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
                </div>
            ) : cards.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl p-16 text-center shadow-sm transition-colors">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Your Wallet is Empty
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 mb-8 max-w-md mx-auto">
                        Click the button below to generate a brand new Debit or
                        Credit Card.
                    </p>
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={() => setIsRequestModalOpen(true)}
                    >
                        Request a Card
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {}
                    <div className="lg:col-span-1 space-y-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white transition-colors">
                            Your Wallet
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 transition-colors">
                            Tap a selected card to flip and view CVV.
                        </p>

                        <div className="space-y-6 max-h-[600px] overflow-y-auto overflow-x-hidden custom-scrollbar px-4 py-4 -mx-4">
                            {}
                            {debitCards.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">
                                        Debit Cards
                                    </h4>
                                    {debitCards.map((card) => {
                                        const isSelected =
                                            selectedCard?._id === card._id;
                                        const isFlipped =
                                            flippedCardId === card._id;
                                        return (
                                            <div
                                                key={card._id}
                                                className="relative h-44 [perspective:1000px] cursor-pointer group"
                                                onClick={() =>
                                                    handleCardClick(card)
                                                }
                                            >
                                                <div
                                                    className={`w-full h-full transition-all duration-500 [transform-style:preserve-3d] ${isFlipped ? "[transform:rotateY(180deg)]" : ""} ${isSelected ? "ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-2 dark:ring-offset-slate-950 rounded-2xl shadow-xl scale-[1.02]" : "hover:scale-[1.01]"}`}
                                                >
                                                    <div
                                                        className={`absolute inset-0 [backface-visibility:hidden] rounded-2xl p-5 flex flex-col justify-between overflow-hidden shadow-lg ${getCardStyle(card.cardType, card.cardNetwork, card.currentStatus === "Blocked")}`}
                                                    >
                                                        <div className="flex justify-between items-start z-20">
                                                            <div className="font-bold text-xs opacity-80">
                                                                {
                                                                    card.cardNetwork
                                                                }
                                                            </div>
                                                            <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded uppercase tracking-widest">
                                                                {card.cardType}
                                                            </span>
                                                        </div>
                                                        <div className="z-20 font-mono text-sm tracking-widest">
                                                            {card.maskedNumber}
                                                        </div>
                                                        <div className="flex justify-between items-end z-20">
                                                            <div className="text-[10px] uppercase font-bold text-white/70">
                                                                {
                                                                    user?.firstName
                                                                }
                                                            </div>
                                                            <div className="text-[9px] text-white/60 font-mono italic">
                                                                {new Date(
                                                                    card.expiryDate,
                                                                ).toLocaleDateString(
                                                                    "en-US",
                                                                    {
                                                                        month: "2-digit",
                                                                        year: "2-digit",
                                                                    },
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div
                                                        className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl p-5 flex flex-col justify-center items-center shadow-lg ${getCardStyle(card.cardType, card.cardNetwork, card.currentStatus === "Blocked")}`}
                                                    >
                                                        <p className="text-[10px] text-center opacity-80">
                                                            Tap to flip back
                                                        </p>
                                                        <div className="font-mono text-xs font-bold bg-white/20 px-3 py-1 rounded mt-2">
                                                            CVV: ***
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {}
                            {creditCards.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">
                                        Credit Cards
                                    </h4>
                                    {creditCards.map((card) => {
                                        const isSelected =
                                            selectedCard?._id === card._id;
                                        const isFlipped =
                                            flippedCardId === card._id;
                                        return (
                                            <div
                                                key={card._id}
                                                className="relative h-44 [perspective:1000px] cursor-pointer group"
                                                onClick={() =>
                                                    handleCardClick(card)
                                                }
                                            >
                                                <div
                                                    className={`w-full h-full transition-all duration-500 [transform-style:preserve-3d] ${isFlipped ? "[transform:rotateY(180deg)]" : ""} ${isSelected ? "ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-2 dark:ring-offset-slate-950 rounded-2xl shadow-xl scale-[1.02]" : "hover:scale-[1.01]"}`}
                                                >
                                                    <div
                                                        className={`absolute inset-0 [backface-visibility:hidden] rounded-2xl p-5 flex flex-col justify-between overflow-hidden shadow-lg ${getCardStyle(card.cardType, card.cardNetwork, card.currentStatus === "Blocked")}`}
                                                    >
                                                        <div className="flex justify-between items-start z-20">
                                                            <div className="font-bold text-xs opacity-80">
                                                                {
                                                                    card.cardNetwork
                                                                }
                                                            </div>
                                                            <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded uppercase tracking-widest">
                                                                {card.cardType}
                                                            </span>
                                                        </div>
                                                        <div className="z-20 font-mono text-sm tracking-widest">
                                                            {card.maskedNumber}
                                                        </div>
                                                        <div className="flex justify-between items-end z-20">
                                                            <div className="text-[10px] uppercase font-bold text-white/70">
                                                                {
                                                                    user?.firstName
                                                                }
                                                            </div>
                                                            <div className="text-[9px] text-white/60 font-mono italic">
                                                                {new Date(
                                                                    card.expiryDate,
                                                                ).toLocaleDateString(
                                                                    "en-US",
                                                                    {
                                                                        month: "2-digit",
                                                                        year: "2-digit",
                                                                    },
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div
                                                        className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl p-5 flex flex-col justify-center items-center shadow-lg ${getCardStyle(card.cardType, card.cardNetwork, card.currentStatus === "Blocked")}`}
                                                    >
                                                        <p className="text-[10px] text-center opacity-80 font-mono">
                                                            Outstanding: ₹
                                                            {card.limits?.outstandingAmount?.toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {}
                            {virtualCards.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">
                                        Virtual Cards
                                    </h4>
                                    {virtualCards.map((card) => {
                                        const isSelected =
                                            selectedCard?._id === card._id;
                                        const isFlipped =
                                            flippedCardId === card._id;
                                        return (
                                            <div
                                                key={card._id}
                                                className="relative h-44 [perspective:1000px] cursor-pointer group"
                                                onClick={() =>
                                                    handleCardClick(card)
                                                }
                                            >
                                                <div
                                                    className={`w-full h-full transition-all duration-500 [transform-style:preserve-3d] ${isFlipped ? "[transform:rotateY(180deg)]" : ""} ${isSelected ? "ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-2 dark:ring-offset-slate-950 rounded-2xl shadow-xl scale-[1.02]" : "hover:scale-[1.01]"}`}
                                                >
                                                    <div
                                                        className={`absolute inset-0 [backface-visibility:hidden] rounded-2xl p-5 flex flex-col justify-between overflow-hidden shadow-lg ${getCardStyle(card.cardType, card.cardNetwork, card.currentStatus === "Blocked")}`}
                                                    >
                                                        <div className="flex justify-between items-start z-20">
                                                            <div className="font-bold text-xs opacity-80">
                                                                {
                                                                    card.cardNetwork
                                                                }
                                                            </div>
                                                            <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded uppercase tracking-widest">
                                                                {card.cardType}
                                                            </span>
                                                        </div>
                                                        <div className="z-20 font-mono text-sm tracking-widest">
                                                            {card.maskedNumber}
                                                        </div>
                                                        <div className="flex justify-between items-end z-20">
                                                            <div className="text-[10px] uppercase font-bold text-white/70">
                                                                {
                                                                    user?.firstName
                                                                }
                                                            </div>
                                                            <div className="text-[9px] text-white/60 font-mono italic">
                                                                {new Date(
                                                                    card.expiryDate,
                                                                ).toLocaleDateString(
                                                                    "en-US",
                                                                    {
                                                                        month: "2-digit",
                                                                        year: "2-digit",
                                                                    },
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div
                                                        className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl p-5 flex flex-col justify-center items-center shadow-lg ${getCardStyle(card.cardType, card.cardNetwork, card.currentStatus === "Blocked")}`}
                                                    >
                                                        <p className="text-[10px] text-center opacity-80">
                                                            Virtual Security
                                                            Enabled
                                                        </p>
                                                        <div className="font-mono text-xs font-bold bg-white/20 px-3 py-1 rounded mt-2">
                                                            CVV: ***
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col transition-colors">
                        {selectedCard && (
                            <>
                                <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 transition-colors">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white transition-colors">
                                            {selectedCard.cardNetwork}{" "}
                                            {selectedCard.cardType}
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono transition-colors">
                                            Ending in{" "}
                                            {selectedCard.maskedNumber.slice(
                                                -4,
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`px-3 py-1 text-xs font-bold rounded-full ${selectedCard.currentStatus === "Active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : selectedCard.currentStatus === "Closed" ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}
                                        >
                                            {selectedCard.currentStatus}
                                        </span>
                                        {selectedCard.currentStatus !==
                                            "Closed" && (
                                            <div className="flex gap-4">
                                                <button
                                                    onClick={() =>
                                                        handleToggleStatus(
                                                            selectedCard._id,
                                                            selectedCard.currentStatus,
                                                        )
                                                    }
                                                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors uppercase tracking-wider"
                                                >
                                                    {selectedCard.currentStatus ===
                                                    "Active"
                                                        ? "Freeze"
                                                        : "Unfreeze"}
                                                </button>

                                                {}
                                                <button
                                                    onClick={() =>
                                                        handleDeleteCard(
                                                            selectedCard._id,
                                                        )
                                                    }
                                                    className={`text-xs font-bold transition-colors uppercase tracking-wider ${
                                                        selectedCard.currentStatus ===
                                                        "Blocked"
                                                            ? selectedCard.cardType ===
                                                                  "Credit" &&
                                                              (selectedCard
                                                                  .limits
                                                                  ?.outstandingAmount ||
                                                                  0) > 0
                                                                ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                                                : "text-red-600 dark:text-red-500 hover:text-red-800 dark:hover:text-red-400"
                                                            : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                                    }`}
                                                    title={
                                                        selectedCard.currentStatus !==
                                                        "Blocked"
                                                            ? "Freeze card first"
                                                            : selectedCard.cardType ===
                                                                    "Credit" &&
                                                                (selectedCard
                                                                    .limits
                                                                    ?.outstandingAmount ||
                                                                    0) > 0
                                                              ? "Clear balance first"
                                                              : ""
                                                    }
                                                >
                                                    Permanent Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
                                    <button
                                        onClick={() => setActiveTab("controls")}
                                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "controls" ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
                                    >
                                        Settings & Controls
                                    </button>
                                    <button
                                        onClick={() =>
                                            setActiveTab("transactions")
                                        }
                                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "transactions" ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
                                    >
                                        Recent Transactions
                                    </button>
                                </div>

                                <div className="p-6 flex-1 overflow-y-auto bg-gray-50/30 dark:bg-slate-900/50 transition-colors">
                                    {activeTab === "controls" && (
                                        <div className="space-y-6 animate-fade-in">
                                            {}
                                            {selectedCard.cardType ===
                                                "Credit" && (
                                                <div className="bg-indigo-900 border border-indigo-700 p-6 rounded-2xl text-white shadow-lg animate-fade-in relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                                                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                                        <div className="space-y-1">
                                                            <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">
                                                                Total
                                                                Outstanding
                                                            </p>
                                                            <h3 className="text-3xl font-black">
                                                                ₹{" "}
                                                                {selectedCard.limits?.outstandingAmount?.toLocaleString()}
                                                            </h3>
                                                            <p className="text-indigo-200/60 text-[10px] font-mono">
                                                                Limit: ₹{" "}
                                                                {selectedCard.limits?.creditLimit?.toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-3 w-full md:w-auto">
                                                            <Button
                                                                onClick={() =>
                                                                    setIsRepayModalOpen(
                                                                        true,
                                                                    )
                                                                }
                                                                className="flex-1 md:flex-none bg-emerald-500 text-white hover:bg-emerald-400 font-bold border-none shadow-lg shadow-emerald-900/20"
                                                            >
                                                                Make Repayment
                                                            </Button>
                                                            <Button
                                                                onClick={() =>
                                                                    setIsExpenseModalOpen(
                                                                        true,
                                                                    )
                                                                }
                                                                className="flex-1 md:flex-none bg-indigo-700 hover:bg-indigo-600 text-white font-bold border-indigo-500 border"
                                                            >
                                                                Create Expense
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {}
                                                    <div className="mt-6 w-full h-1.5 bg-indigo-950 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-1000"
                                                            style={{
                                                                width: `${Math.min(100, ((selectedCard.limits?.outstandingAmount || 0) / (selectedCard.limits?.creditLimit || 1)) * 100)}%`,
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}

                                            {}
                                            {selectedCard.cardType ===
                                                "Debit" &&
                                                selectedCard.currentStatus ===
                                                    "Active" && (
                                                    <div className="flex gap-4">
                                                        <Button
                                                            variant="secondary"
                                                            onClick={() =>
                                                                setIsExpenseModalOpen(
                                                                    true,
                                                                )
                                                            }
                                                            className="flex-1 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700/50 shadow-sm flex items-center justify-center gap-2 transition-colors"
                                                        >
                                                            <svg
                                                                className="w-4 h-4 text-blue-600 dark:text-blue-400"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth="2"
                                                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                ></path>
                                                            </svg>
                                                            Create Dummy Expense
                                                        </Button>
                                                    </div>
                                                )}

                                            <div className="bg-white dark:bg-slate-800/50 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm transition-colors">
                                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4 border-b border-gray-100 dark:border-slate-700 pb-4">
                                                    <div>
                                                        <h4 className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                                            <svg
                                                                className="w-5 h-5 text-blue-600 dark:text-blue-400"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth="2"
                                                                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                                                                ></path>
                                                            </svg>
                                                            Spending Limits
                                                        </h4>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            Control your daily
                                                            transaction caps.
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() =>
                                                            openLimitModal(
                                                                selectedCard,
                                                            )
                                                        }
                                                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-2"
                                                    >
                                                        <svg
                                                            className="w-4 h-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                            ></path>
                                                        </svg>
                                                        Edit Limits
                                                    </Button>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                                    <div className="border border-blue-100 dark:border-blue-800/30 rounded-xl p-4 bg-blue-50/50 dark:bg-blue-900/20 transition-colors">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                                                            Daily Online
                                                        </p>
                                                        <p className="font-bold text-gray-900 dark:text-white text-xl">
                                                            ₹{" "}
                                                            {selectedCard.limits?.dailyOnlineLimit?.toLocaleString() ||
                                                                "100,000"}
                                                        </p>
                                                    </div>
                                                    <div className="border border-indigo-100 dark:border-indigo-800/30 rounded-xl p-4 bg-indigo-50/50 dark:bg-indigo-900/20 transition-colors">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                                                            Daily ATM
                                                        </p>
                                                        <p className="font-bold text-gray-900 dark:text-white text-xl">
                                                            ₹{" "}
                                                            {selectedCard.limits?.dailyWithdrawalLimit?.toLocaleString() ||
                                                                "50,000"}
                                                        </p>
                                                    </div>
                                                    <div className="border border-teal-100 dark:border-teal-800/30 rounded-xl p-4 bg-teal-50/50 dark:bg-teal-900/20 transition-colors">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                                                            Contactless
                                                        </p>
                                                        <p className="font-bold text-gray-900 dark:text-white text-xl">
                                                            ₹{" "}
                                                            {selectedCard.limits?.contactlessLimit?.toLocaleString() ||
                                                                "5,000"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white dark:bg-slate-800/50 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm transition-colors">
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                                                    Security Features
                                                </h4>
                                                <div className="space-y-3">
                                                    {}
                                                    <div
                                                        className={`flex items-center justify-between p-3 border border-gray-100 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${isUpdatingFeature ? "opacity-50 pointer-events-none" : ""}`}
                                                        onClick={() =>
                                                            handleToggleFeature(
                                                                "online",
                                                            )
                                                        }
                                                    >
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                                Online
                                                                Transactions
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                Allow payments
                                                                on e-commerce
                                                                sites.
                                                            </p>
                                                        </div>
                                                        <div
                                                            className={`w-11 h-6 rounded-full relative shadow-inner transition-colors duration-300 ${selectedCard.isOnlineEnabled ? "bg-blue-600" : "bg-gray-300 dark:bg-slate-600"}`}
                                                        >
                                                            <div
                                                                className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow transition-transform duration-300 ${selectedCard.isOnlineEnabled ? "translate-x-6" : "translate-x-1"}`}
                                                            ></div>
                                                        </div>
                                                    </div>

                                                    <div
                                                        className={`flex items-center justify-between p-3 border border-gray-100 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${isUpdatingFeature ? "opacity-50 pointer-events-none" : ""}`}
                                                        onClick={() =>
                                                            handleToggleFeature(
                                                                "international",
                                                            )
                                                        }
                                                    >
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                                International
                                                                Usage
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                Allow
                                                                transactions in
                                                                foreign
                                                                currencies.
                                                            </p>
                                                        </div>
                                                        <div
                                                            className={`w-11 h-6 rounded-full relative shadow-inner transition-colors duration-300 ${selectedCard.isInternationalEnabled ? "bg-blue-600" : "bg-gray-300 dark:bg-slate-600"}`}
                                                        >
                                                            <div
                                                                className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow transition-transform duration-300 ${selectedCard.isInternationalEnabled ? "translate-x-6" : "translate-x-1"}`}
                                                            ></div>
                                                        </div>
                                                    </div>

                                                    <div className="p-4 bg-blue-50/30 dark:bg-blue-900/20 rounded-xl border border-blue-100/50 dark:border-blue-800/30 mt-4 transition-colors">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                                    Virtual
                                                                    Security PIN
                                                                </p>
                                                                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                                                    Enable/Change
                                                                    your 4-digit
                                                                    card PIN.
                                                                </p>
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-xs h-8 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400 dark:bg-transparent dark:hover:bg-slate-800"
                                                                onClick={() =>
                                                                    setIsPinModalOpen(
                                                                        true,
                                                                    )
                                                                }
                                                            >
                                                                Set New PIN
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === "transactions" && (
                                        <div className="animate-fade-in space-y-4">
                                            {isTransactionsLoading ? (
                                                <div className="py-10 flex justify-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                                                </div>
                                            ) : cardTransactions.length ===
                                              0 ? (
                                                <div className="text-center p-10 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800/50 shadow-sm transition-colors">
                                                    <p className="font-medium">
                                                        No recent transactions
                                                        found.
                                                    </p>
                                                    <p className="text-xs mt-1">
                                                        Simulate an expense to
                                                        see it here.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="bg-white dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm transition-colors">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-100 dark:border-slate-700 transition-colors">
                                                            <tr>
                                                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                    Date
                                                                </th>
                                                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                    Merchant/Memo
                                                                </th>
                                                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                                                                    Amount
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                                                            {cardTransactions.map(
                                                                (tx) => (
                                                                    <tr
                                                                        key={
                                                                            tx._id
                                                                        }
                                                                        className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors"
                                                                    >
                                                                        <td className="px-6 py-4">
                                                                            <p className="text-xs text-gray-900 dark:text-gray-100 font-medium">
                                                                                {new Date(
                                                                                    tx.createdAt,
                                                                                ).toLocaleDateString(
                                                                                    "en-GB",
                                                                                    {
                                                                                        day: "2-digit",
                                                                                        month: "short",
                                                                                    },
                                                                                )}
                                                                            </p>
                                                                            <p className="text-[9px] text-gray-400 dark:text-gray-500">
                                                                                {new Date(
                                                                                    tx.createdAt,
                                                                                ).toLocaleTimeString(
                                                                                    [],
                                                                                    {
                                                                                        hour: "2-digit",
                                                                                        minute: "2-digit",
                                                                                    },
                                                                                )}
                                                                            </p>
                                                                        </td>
                                                                        <td className="px-6 py-4">
                                                                            <p className="text-xs text-gray-900 dark:text-gray-100 font-semibold">
                                                                                {
                                                                                    tx.memo
                                                                                }
                                                                            </p>
                                                                            <p className="text-[9px] text-gray-400 dark:text-gray-500 font-mono uppercase">
                                                                                {
                                                                                    tx
                                                                                        .transaction
                                                                                        ?.referenceId
                                                                                }
                                                                            </p>
                                                                        </td>
                                                                        <td className="px-6 py-4 text-right">
                                                                            <p
                                                                                className={`text-sm font-bold ${tx.entryType === "Debit" ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
                                                                            >
                                                                                {tx.entryType ===
                                                                                "Debit"
                                                                                    ? "-"
                                                                                    : "+"}{" "}
                                                                                ₹{" "}
                                                                                {tx.amount.toLocaleString()}
                                                                            </p>
                                                                        </td>
                                                                    </tr>
                                                                ),
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {}
            <Modal
                isOpen={isRequestModalOpen}
                onClose={() => !isGenerating && setIsRequestModalOpen(false)}
                title="Create New Card"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Card Type
                        </label>
                        <select
                            className="w-full border border-gray-300 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                            value={newCardType}
                            onChange={(e) => setNewCardType(e.target.value)}
                            disabled={isGenerating}
                        >
                            <option value="Debit">Debit Card</option>
                            <option value="Credit">Credit Card</option>
                            <option value="Virtual">
                                Virtual One-Time Card
                            </option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Card Network
                        </label>
                        <select
                            className="w-full border border-gray-300 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-colors"
                            value={newCardNetwork}
                            onChange={(e) => setNewCardNetwork(e.target.value)}
                            disabled={isGenerating}
                        >
                            <option value="Visa">Visa</option>
                            <option value="MasterCard">MasterCard</option>
                            <option value="Amex">American Express</option>
                            <option value="RuPay">RuPay</option>
                        </select>
                    </div>

                    {newCardType === "Debit" ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Link to Account
                            </label>
                            <select
                                className="w-full border border-gray-300 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-colors"
                                value={linkAccountId}
                                onChange={(e) =>
                                    setLinkAccountId(e.target.value)
                                }
                                disabled={isGenerating}
                            >
                                {accounts.map((acc) => (
                                    <option key={acc._id} value={acc._id}>
                                        {acc.accountNumber} ({acc.accountType})
                                        - ₹{acc.balance.toLocaleString()}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Credit Limit
                            </label>
                            <Input
                                type="number"
                                placeholder="Enter desired limit"
                                value={newCreditLimit}
                                onChange={(e) =>
                                    setNewCreditLimit(e.target.value)
                                }
                                disabled={isGenerating}
                            />
                        </div>
                    )}
                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-slate-800 mt-4 transition-colors">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsRequestModalOpen(false)}
                            disabled={isGenerating}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            onClick={handleRequestCard}
                            isLoading={isGenerating}
                        >
                            Generate Card
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isLimitModalOpen}
                onClose={() =>
                    !isSubmittingLimits && setIsLimitModalOpen(false)
                }
                title="Edit Card Limits"
            >
                <form onSubmit={handleUpdateLimits} className="space-y-4">
                    <Input
                        label="Daily Online Limit"
                        type="number"
                        value={onlineLimit}
                        onChange={(e) => setOnlineLimit(e.target.value)}
                        required
                        disabled={isSubmittingLimits}
                    />
                    <Input
                        label="Daily ATM Limit"
                        type="number"
                        value={atmLimit}
                        onChange={(e) => setAtmLimit(e.target.value)}
                        required
                        disabled={isSubmittingLimits}
                    />
                    <Input
                        label="Contactless Limit"
                        type="number"
                        value={contactlessLimit}
                        onChange={(e) => setContactlessLimit(e.target.value)}
                        required
                        disabled={isSubmittingLimits}
                    />
                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-slate-800 mt-4 transition-colors">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsLimitModalOpen(false)}
                            disabled={isSubmittingLimits}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isSubmittingLimits}
                        >
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isExpenseModalOpen}
                onClose={() =>
                    !isSubmittingExpense && setIsExpenseModalOpen(false)
                }
                title="Simulate Card Expense"
            >
                <form onSubmit={handleCreateExpense} className="space-y-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 transition-colors">
                        This will simulate a transaction using your{" "}
                        {selectedCard?.cardType} card.
                    </p>
                    <Input
                        label="Merchant Name"
                        placeholder="e.g. Amazon, Starbucks"
                        value={expenseMerchant}
                        onChange={(e) => setExpenseMerchant(e.target.value)}
                        required
                        disabled={isSubmittingExpense}
                    />
                    <Input
                        label="Amount (₹)"
                        type="number"
                        placeholder="0.00"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                        required
                        disabled={isSubmittingExpense}
                    />

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <label className="flex items-center gap-3 p-3 border border-gray-100 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                            <input
                                type="checkbox"
                                className="w-4 h-4 text-blue-600 rounded bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 focus:ring-blue-500"
                                checked={isOnlineExpense}
                                onChange={(e) => {
                                    setIsOnlineExpense(e.target.checked);
                                    if (e.target.checked) {
                                        setIsATMExpense(false);
                                        setIsContactlessExpense(false);
                                    }
                                }}
                            />
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Online?
                            </span>
                        </label>
                        <label className="flex items-center gap-3 p-3 border border-gray-100 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                            <input
                                type="checkbox"
                                className="w-4 h-4 text-blue-600 rounded bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 focus:ring-blue-500"
                                checked={isInternationalExpense}
                                onChange={(e) =>
                                    setIsInternationalExpense(e.target.checked)
                                }
                            />
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                International?
                            </span>
                        </label>
                        <label className="flex items-center gap-3 p-3 border border-gray-100 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                            <input
                                type="checkbox"
                                className="w-4 h-4 text-blue-600 rounded bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 focus:ring-blue-500"
                                checked={isContactlessExpense}
                                onChange={(e) => {
                                    setIsContactlessExpense(e.target.checked);
                                    if (e.target.checked) {
                                        setIsOnlineExpense(false);
                                        setIsATMExpense(false);
                                    }
                                }}
                            />
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Contactless?
                            </span>
                        </label>
                        <label className="flex items-center gap-3 p-3 border border-gray-100 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                            <input
                                type="checkbox"
                                className="w-4 h-4 text-blue-600 rounded bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 focus:ring-blue-500"
                                checked={isATMExpense}
                                onChange={(e) => {
                                    setIsATMExpense(e.target.checked);
                                    if (e.target.checked) {
                                        setIsOnlineExpense(false);
                                        setIsContactlessExpense(false);
                                    }
                                }}
                            />
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                ATM?
                            </span>
                        </label>
                    </div>
                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-slate-800 mt-4 transition-colors">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsExpenseModalOpen(false)}
                            disabled={isSubmittingExpense}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isSubmittingExpense}
                        >
                            Confirm Transaction
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isRepayModalOpen}
                onClose={() => !isSubmittingRepay && setIsRepayModalOpen(false)}
                title="Credit Card Repayment"
            >
                <form onSubmit={handleRepayCreditCard} className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4 transition-colors">
                        <p className="text-xs text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider mb-1">
                            Current Outstanding
                        </p>
                        <p className="text-2xl font-black text-blue-900 dark:text-blue-100">
                            ₹{" "}
                            {selectedCard?.limits?.outstandingAmount?.toLocaleString() ||
                                "0"}
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Pay From Account
                        </label>
                        <select
                            className="w-full border border-gray-300 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-colors"
                            value={repaySourceAccountId}
                            onChange={(e) =>
                                setRepaySourceAccountId(e.target.value)
                            }
                            disabled={isSubmittingRepay}
                        >
                            {accounts.map((acc) => (
                                <option key={acc._id} value={acc._id}>
                                    {acc.accountNumber} - ₹
                                    {acc.balance.toLocaleString()}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Input
                        label="Repayment Amount (₹)"
                        type="number"
                        placeholder="Enter amount to pay"
                        value={repayAmount}
                        onChange={(e) => setRepayAmount(e.target.value)}
                        required
                        disabled={isSubmittingRepay}
                    />
                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-slate-800 mt-4 transition-colors">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsRepayModalOpen(false)}
                            disabled={isSubmittingRepay}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isSubmittingRepay}
                        >
                            Process Payment
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isPinModalOpen}
                onClose={() => !isSubmittingPin && setIsPinModalOpen(false)}
                title="Update Card PIN"
            >
                <form onSubmit={handleUpdatePin} className="space-y-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                        Set a new 4-digit PIN for your transactions.
                    </p>
                    <Input
                        label="New 4-Digit PIN"
                        type="password"
                        maxLength={4}
                        placeholder="****"
                        value={newPin}
                        onChange={(e) =>
                            setNewPin(e.target.value.replace(/\D/g, ""))
                        }
                        required
                        disabled={isSubmittingPin}
                    />
                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-slate-800 mt-4 transition-colors">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsPinModalOpen(false)}
                            disabled={isSubmittingPin}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isSubmittingPin}
                        >
                            Update PIN
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
