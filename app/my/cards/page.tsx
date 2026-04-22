"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useCards } from "@/hooks/useCards";
import { CardList } from "@/components/cards/CardList";
import { CardDetails } from "@/components/cards/CardDetails";
import { CardModals } from "@/components/cards/CardModals";

export default function EnhancedCardsPage() {
    const hookState = useCards();

    const {
        user,
        isLoading,
        authLoading,
        cards,
        searchQuery, setSearchQuery,
        selectedCard,
        debitCards,
        creditCards,
        virtualCards,
        flippedCardId,
        handleCardClick,
        setIsRequestModalOpen,
    } = hookState;

    if (authLoading || isLoading)
        return (
            <div className="py-20 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
        );

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
                <div className="flex gap-3 items-center">
                    <input
                        type="text"
                        placeholder="Search cards..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                    <Button
                        variant="primary"
                        onClick={() => setIsRequestModalOpen(true)}
                        className="shadow-md"
                    >
                        + New Card
                    </Button>
                </div>
            </header>

            {cards.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl p-16 text-center shadow-sm transition-colors">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Your Wallet is Empty
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 mb-8 max-w-md mx-auto">
                        Click the button below to generate a brand new Debit or Credit Card.
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
                    <CardList
                        debitCards={debitCards}
                        creditCards={creditCards}
                        virtualCards={virtualCards}
                        selectedCard={selectedCard}
                        flippedCardId={flippedCardId}
                        user={user}
                        handleCardClick={handleCardClick}
                    />
                    <CardDetails hookState={hookState} />
                </div>
            )}

            <CardModals hookState={hookState} />
        </div>
    );
}
