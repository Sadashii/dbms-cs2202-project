import React from "react";
import { Card } from "@/hooks/useCards";

interface CardListProps {
    debitCards: Card[];
    creditCards: Card[];
    virtualCards: Card[];
    selectedCard: Card | null;
    flippedCardId: string | null;
    user: { firstName?: string } | null;
    handleCardClick: (card: Card) => void;
}

export const getCardStyle = (
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

export const CardList: React.FC<CardListProps> = ({
    debitCards,
    creditCards,
    virtualCards,
    selectedCard,
    flippedCardId,
    user,
    handleCardClick,
}) => {
    const isFrozenCard = (status: string) =>
        status === "Frozen" || status === "Blocked";

    return (
        <div className="lg:col-span-1 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white transition-colors">
                Your Wallet
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 transition-colors">
                Tap a selected card to flip and view CVV.
            </p>

            <div className="space-y-6 max-h-[600px] overflow-y-auto overflow-x-hidden custom-scrollbar px-4 py-4 -mx-4">
                {debitCards.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">
                            Debit Cards
                        </h4>
                        {debitCards.map((card) => {
                            const isSelected = selectedCard?._id === card._id;
                            const isFlipped = flippedCardId === card._id;
                            return (
                                <div
                                    key={card._id}
                                    className="relative h-44 [perspective:1000px] cursor-pointer group"
                                    onClick={() => handleCardClick(card)}
                                >
                                    <div
                                        className={`w-full h-full transition-all duration-500 [transform-style:preserve-3d] ${isFlipped ? "[transform:rotateY(180deg)]" : ""} ${isSelected ? "ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-2 dark:ring-offset-slate-950 rounded-2xl shadow-xl scale-[1.02]" : "hover:scale-[1.01]"}`}
                                    >
                                        <div
                                            className={`absolute inset-0 [backface-visibility:hidden] rounded-2xl p-5 flex flex-col justify-between overflow-hidden shadow-lg ${getCardStyle(card.cardType, card.cardNetwork, isFrozenCard(card.currentStatus))}`}
                                        >
                                            <div className="flex justify-between items-start z-20">
                                                <div className="font-bold text-xs opacity-80">
                                                    {card.cardNetwork}
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
                                                    {user?.firstName}
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
                                            className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl p-5 flex flex-col justify-center items-center shadow-lg ${getCardStyle(card.cardType, card.cardNetwork, isFrozenCard(card.currentStatus))}`}
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

                {creditCards.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">
                            Credit Cards
                        </h4>
                        {creditCards.map((card) => {
                            const isSelected = selectedCard?._id === card._id;
                            const isFlipped = flippedCardId === card._id;
                            return (
                                <div
                                    key={card._id}
                                    className="relative h-44 [perspective:1000px] cursor-pointer group"
                                    onClick={() => handleCardClick(card)}
                                >
                                    <div
                                        className={`w-full h-full transition-all duration-500 [transform-style:preserve-3d] ${isFlipped ? "[transform:rotateY(180deg)]" : ""} ${isSelected ? "ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-2 dark:ring-offset-slate-950 rounded-2xl shadow-xl scale-[1.02]" : "hover:scale-[1.01]"}`}
                                    >
                                        <div
                                            className={`absolute inset-0 [backface-visibility:hidden] rounded-2xl p-5 flex flex-col justify-between overflow-hidden shadow-lg ${getCardStyle(card.cardType, card.cardNetwork, isFrozenCard(card.currentStatus))}`}
                                        >
                                            <div className="flex justify-between items-start z-20">
                                                <div className="font-bold text-xs opacity-80">
                                                    {card.cardNetwork}
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
                                                    {user?.firstName}
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
                                            className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl p-5 flex flex-col justify-center items-center shadow-lg ${getCardStyle(card.cardType, card.cardNetwork, isFrozenCard(card.currentStatus))}`}
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

                {virtualCards.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">
                            Virtual Cards
                        </h4>
                        {virtualCards.map((card) => {
                            const isSelected = selectedCard?._id === card._id;
                            const isFlipped = flippedCardId === card._id;
                            return (
                                <div
                                    key={card._id}
                                    className="relative h-44 [perspective:1000px] cursor-pointer group"
                                    onClick={() => handleCardClick(card)}
                                >
                                    <div
                                        className={`w-full h-full transition-all duration-500 [transform-style:preserve-3d] ${isFlipped ? "[transform:rotateY(180deg)]" : ""} ${isSelected ? "ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-2 dark:ring-offset-slate-950 rounded-2xl shadow-xl scale-[1.02]" : "hover:scale-[1.01]"}`}
                                    >
                                        <div
                                            className={`absolute inset-0 [backface-visibility:hidden] rounded-2xl p-5 flex flex-col justify-between overflow-hidden shadow-lg ${getCardStyle(card.cardType, card.cardNetwork, isFrozenCard(card.currentStatus))}`}
                                        >
                                            <div className="flex justify-between items-start z-20">
                                                <div className="font-bold text-xs opacity-80">
                                                    {card.cardNetwork}
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
                                                    {user?.firstName}
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
                                            className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl p-5 flex flex-col justify-center items-center shadow-lg ${getCardStyle(card.cardType, card.cardNetwork, isFrozenCard(card.currentStatus))}`}
                                        >
                                            <p className="text-[10px] text-center opacity-80">
                                                Virtual Security Enabled
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
    );
};
