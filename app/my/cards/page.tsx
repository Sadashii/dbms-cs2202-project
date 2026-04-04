"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";

interface Card {
  _id: string;
  cardType: string; // Debit, Credit, Virtual
  cardNetwork: string; // Visa, MasterCard, RuPay
  maskedNumber: string;
  expiryDate: string;
  currentStatus: string;
  limits: {
    dailyWithdrawalLimit: number;
    dailyOnlineLimit: number;
    outstandingAmount?: number;
    creditLimit?: number;
  };
}

export default function CardsPage() {
  const { apiFetch, requireAuth } = useAuthContext();
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  requireAuth("/auth/login");

  useEffect(() => {
    const fetchCards = async () => {
      try {
        // Assuming you have or will create an /api/cards GET route
        const res = await apiFetch("/api/cards");
        if (res.ok) {
          const data = await res.json();
          setCards(data.cards || []);
        }
      } catch (error) {
        console.error("Failed to fetch cards", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCards();
  }, [apiFetch]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Cards</h1>
          <p className="text-sm text-gray-500">Manage your physical and virtual cards.</p>
        </div>
        <Button variant="primary">Request New Card</Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full py-10 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : cards.length === 0 ? (
          <div className="col-span-full py-10 text-center text-gray-500 bg-white border border-gray-200 rounded-xl shadow-sm">
            No active cards found.
          </div>
        ) : (
          cards.map((card) => (
            <div key={card._id} className="flex flex-col gap-4">
              {/* Card Visual */}
              <div className={`relative rounded-2xl p-6 h-52 text-white shadow-lg overflow-hidden flex flex-col justify-between ${card.cardType === 'Credit' ? 'bg-gradient-to-br from-slate-800 to-black' : 'bg-gradient-to-br from-blue-600 to-blue-800'}`}>
                {/* Decorative background circle */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                
                <div className="flex justify-between items-start z-10">
                  <div className="font-semibold tracking-widest text-sm uppercase opacity-80">
                    {card.cardType}
                  </div>
                  <div className="font-bold italic text-xl">
                    {card.cardNetwork}
                  </div>
                </div>

                <div className="z-10">
                  <div className="font-mono text-2xl tracking-widest mb-2 opacity-90">
                    **** **** **** {card.maskedNumber.slice(-4)}
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-xs opacity-70 uppercase tracking-widest mb-1">Valid Thru</div>
                      <div className="font-mono text-sm">{new Date(card.expiryDate).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' })}</div>
                    </div>
                    {card.currentStatus === 'Active' ? (
                       <span className="bg-green-400/20 text-green-200 text-xs px-2 py-1 rounded-md border border-green-400/30">Active</span>
                    ) : (
                       <span className="bg-red-400/20 text-red-200 text-xs px-2 py-1 rounded-md border border-red-400/30">{card.currentStatus}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Controls */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex gap-2">
                <Button variant="outline" className="flex-1 text-xs" size="sm">Manage Limits</Button>
                <Button variant="danger" className="flex-1 text-xs" size="sm">Block Card</Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}