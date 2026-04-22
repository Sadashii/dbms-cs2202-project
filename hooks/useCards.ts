import { useState, useEffect } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export interface Card {
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

export interface Account {
    _id: string;
    accountNumber: string;
    accountType: string;
    balance: number;
}

export interface CardTransaction {
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

export const useCards = () => {
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
                } else {
                    setSelectedCard(null);
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
        } catch (error: unknown) {
            toast.error(
                `Network Error: ${error instanceof Error ? error.message : "Failed to create card."}`,
            );
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
        } catch {
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
        const isFrozen = ["Frozen", "Blocked"].includes(currentStatus);
        const action = isFrozen ? "Unfreeze" : "Freeze";
        if (!confirm(`Are you sure you want to ${action} this card?`)) return;

        try {
            const res = await apiFetch("/api/cards", {
                method: "PATCH",
                body: JSON.stringify({ cardId, action: "TOGGLE_STATUS" }),
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(
                    `Card ${action === "Freeze" ? "frozen" : "reactivated"} successfully.`,
                );
                await fetchCards();
            } else {
                toast.error(
                    data.message || `Failed to ${action.toLowerCase()} card.`,
                );
            }
        } catch (error) {
            console.error("Status update failed", error);
            toast.error(`Failed to ${action.toLowerCase()} card.`);
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

        if (!["Frozen", "Blocked"].includes(cardToDelete.currentStatus)) {
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
            const data = await res.json();
            if (res.ok) {
                toast.success("Card deleted successfully.");
                await fetchCards();
            } else {
                toast.error(data.message || "Failed to delete card.");
            }
        } catch (error) {
            console.error("Deletion failed", error);
            toast.error("Failed to delete card.");
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

    return {
        user,
        isLoading,
        authLoading,
        cards,
        searchQuery,
        setSearchQuery,
        selectedCard,
        setSelectedCard,
        activeTab,
        setActiveTab,
        flippedCardId,
        setFlippedCardId,
        accounts,
        cardTransactions,
        isTransactionsLoading,
        isUpdatingFeature,
        isRequestModalOpen,
        setIsRequestModalOpen,
        isLimitModalOpen,
        setIsLimitModalOpen,
        isExpenseModalOpen,
        setIsExpenseModalOpen,
        isRepayModalOpen,
        setIsRepayModalOpen,
        isPinModalOpen,
        setIsPinModalOpen,
        isGenerating,
        isSubmittingLimits,
        isSubmittingExpense,
        isSubmittingRepay,
        isSubmittingPin,
        newPin,
        setNewPin,
        newCardType,
        setNewCardType,
        newCardNetwork,
        setNewCardNetwork,
        linkAccountId,
        setLinkAccountId,
        newCreditLimit,
        setNewCreditLimit,
        onlineLimit,
        setOnlineLimit,
        atmLimit,
        setAtmLimit,
        contactlessLimit,
        setContactlessLimit,
        expenseAmount,
        setExpenseAmount,
        expenseMerchant,
        setExpenseMerchant,
        isOnlineExpense,
        setIsOnlineExpense,
        isInternationalExpense,
        setIsInternationalExpense,
        isContactlessExpense,
        setIsContactlessExpense,
        isATMExpense,
        setIsATMExpense,
        repayAmount,
        setRepayAmount,
        repaySourceAccountId,
        setRepaySourceAccountId,
        filteredCards,
        debitCards,
        creditCards,
        virtualCards,
        handleCardClick,
        handleRequestCard,
        handleUpdateLimits,
        handleUpdatePin,
        openLimitModal,
        handleToggleStatus,
        handleToggleFeature,
        handleDeleteCard,
        handleCreateExpense,
        handleRepayCreditCard,
    };
};
