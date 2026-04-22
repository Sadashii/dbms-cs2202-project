import React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCards } from "@/hooks/useCards";

interface CardModalsProps {
    hookState: ReturnType<typeof useCards>;
}

export const CardModals: React.FC<CardModalsProps> = ({ hookState }) => {
    const {
        selectedCard,
        accounts,
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
        handleRequestCard,
        handleUpdateLimits,
        handleCreateExpense,
        handleRepayCreditCard,
        handleUpdatePin,
    } = hookState;

    return (
        <>
            {/* New Card Modal */}
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

            {/* Edit Limits Modal */}
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

            {/* Simulate Expense Modal */}
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

            {/* Repay Credit Card Modal */}
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

            {/* Change PIN Modal */}
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
        </>
    );
};
