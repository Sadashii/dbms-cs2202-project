"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";

interface Card {
  _id: string;
  cardType: string;
  cardNetwork: string;
  maskedNumber: string;
  expiryDate: string;
  currentStatus: string;
  currency: string;
  limits: {
    dailyWithdrawalLimit: number;
    dailyOnlineLimit: number;
    contactlessLimit: number;
    outstandingAmount?: number;
  };
}

export default function EnhancedCardsPage() {
  const { apiFetch, requireAuth, user } = useAuthContext();
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Selection
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [activeTab, setActiveTab] = useState<"controls" | "transactions" | "analytics">("controls");
  
  // Flip Animation State
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);
  
  // Toggle States
  const [isOnlineTxnEnabled, setIsOnlineTxnEnabled] = useState(true);
  const [isIntlTxnEnabled, setIsIntlTxnEnabled] = useState(false);

  // Modal States
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  
  // Forms & Generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmittingLimits, setIsSubmittingLimits] = useState(false);
  
  const [newCardType, setNewCardType] = useState("Debit");
  const [newCardNetwork, setNewCardNetwork] = useState("Visa");

  const [onlineLimit, setOnlineLimit] = useState("");
  const [atmLimit, setAtmLimit] = useState("");
  const [contactlessLimit, setContactlessLimit] = useState("");

  requireAuth("/auth/login");

  const fetchCards = async (autoSelectLatest = false) => {
    try {
      setIsLoading(true);
      const res = await apiFetch("/api/cards");
      if (res.ok) {
        const data = await res.json();
        const validCards = (data.cards || []).filter((c: Card) => c.cardType === 'Debit' || c.cardType === 'Credit');
        
        setCards(validCards);
        
        if (validCards.length > 0) {
           if (autoSelectLatest) {
              setSelectedCard(validCards[validCards.length - 1]);
           } else if (!selectedCard || !validCards.find((c: Card) => c._id === selectedCard._id)) {
              setSelectedCard(validCards[0]);
           } else {
              const updatedSelected = validCards.find((c: Card) => c._id === selectedCard._id);
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

  useEffect(() => {
    fetchCards();
  }, [apiFetch]);

  // Handle click to select OR flip if already selected
  const handleCardClick = (card: Card) => {
    if (selectedCard?._id === card._id) {
        // Flip it!
        setFlippedCardId(prev => prev === card._id ? null : card._id);
    } else {
        // Select it and reset flip
        setSelectedCard(card);
        setFlippedCardId(null);
    }
  };

  const handleRequestCard = async () => {
    setIsGenerating(true);
    try {
      const res = await apiFetch("/api/cards", {
        method: "POST",
        body: JSON.stringify({ cardType: newCardType, cardNetwork: newCardNetwork })
      });
      
      const data = await res.json();
      if (res.ok) {
        setIsRequestModalOpen(false); 
        await fetchCards(true); 
      } else {
        alert(`Server Error: ${data.message || "Unknown error occurred"}`);
      }
    } catch (error: any) {
      alert(`Network Error: ${error.message}`);
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
            contactlessLimit: parseFloat(contactlessLimit)
          } 
        })
      });

      if (res.ok) {
        setIsLimitModalOpen(false);
        await fetchCards(); 
      } else {
        alert("Failed to update limits.");
      }
    } catch (error) {
      console.error("Limit update failed", error);
    } finally {
      setIsSubmittingLimits(false);
    }
  };

  const openLimitModal = (card: Card) => {
    setSelectedCard(card);
    setOnlineLimit(card.limits?.dailyOnlineLimit?.toString() || "100000");
    setAtmLimit(card.limits?.dailyWithdrawalLimit?.toString() || "50000");
    setContactlessLimit(card.limits?.contactlessLimit?.toString() || "5000");
    setIsLimitModalOpen(true);
  };

  const handleToggleStatus = async (cardId: string, currentStatus: string) => {
    const action = currentStatus === 'Active' ? 'Freeze' : 'Unfreeze';
    if (!confirm(`Are you sure you want to ${action} this card?`)) return;

    try {
      const res = await apiFetch("/api/cards", {
        method: "PATCH",
        body: JSON.stringify({ cardId, action: "TOGGLE_STATUS" })
      });
      if (res.ok) fetchCards();
    } catch (error) {
      console.error("Status update failed", error);
    }
  };

  const filteredCards = cards.filter(c => 
    c.maskedNumber.includes(searchQuery) || c.cardNetwork.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCardStyle = (type: string, network: string, isBlocked: boolean) => {
    if (isBlocked) return "bg-gray-800 opacity-75 grayscale";
    if (type === 'Credit') {
      if (network === 'Amex') return "bg-gradient-to-br from-slate-800 via-gray-900 to-black text-amber-50";
      return "bg-gradient-to-tr from-purple-900 via-indigo-900 to-slate-900 text-white";
    } else { 
      if (network === 'MasterCard') return "bg-gradient-to-br from-orange-600 to-red-600 text-white";
      if (network === 'RuPay') return "bg-gradient-to-br from-teal-600 to-emerald-800 text-white";
      return "bg-gradient-to-br from-blue-600 to-cyan-700 text-white"; 
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Cards</h1>
          <p className="text-gray-500">Manage your Debit and Credit limits and features.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="primary" onClick={() => setIsRequestModalOpen(true)} className="shadow-md">
            + New Card
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
      ) : cards.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-16 text-center shadow-sm">
          <h3 className="text-xl font-bold text-gray-900">Your Wallet is Empty</h3>
          <p className="text-gray-500 mt-2 mb-8 max-w-md mx-auto">Click the button below to generate a brand new Debit or Credit Card.</p>
          <Button variant="primary" size="lg" onClick={() => setIsRequestModalOpen(true)}>Request a Card</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Card List */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="font-semibold text-gray-900">Your Wallet</h3>
            <p className="text-xs text-gray-400 mb-2">Tap a selected card to flip and view CVV.</p>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2 pb-4">
              {filteredCards.map((card) => {
                const isSelected = selectedCard?._id === card._id;
                const isFlipped = flippedCardId === card._id;

                return (
                  <div key={card._id} className="relative h-48 [perspective:1000px] cursor-pointer group" onClick={() => handleCardClick(card)}>
                    {/* The 3D Flipping Container */}
                    <div className={`w-full h-full transition-all duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''} ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 rounded-2xl shadow-xl scale-[1.02]' : 'hover:scale-[1.01]'}`}>
                      
                      {/* --- FRONT FACE --- */}
                      <div className={`absolute inset-0 [backface-visibility:hidden] rounded-2xl p-6 flex flex-col justify-between overflow-hidden shadow-lg ${getCardStyle(card.cardType, card.cardNetwork, card.currentStatus === 'Blocked')}`}>
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-white/0 opacity-50 z-0"></div>
                        <div className="absolute -top-16 -right-16 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl z-0"></div>
                        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-card-shimmer pointer-events-none z-10"></div>
                        
                        <div className="flex justify-between items-start z-20">
                          <div className="flex items-center gap-2">
                            <svg className="w-8 h-6 text-yellow-300/80" viewBox="0 0 40 30" fill="currentColor">
                              <path d="M4,0 C1.790861,0 0,1.790861 0,4 L0,26 C0,28.209139 1.790861,30 4,30 L36,30 C38.209139,30 40,28.209139 40,26 L40,4 C40,1.790861 38.209139,0 36,0 L4,0 Z M12,2 L28,2 L28,8 L12,8 L12,2 Z M30,2 L38,2 L38,10 L30,10 L30,2 Z M2,2 L10,2 L10,10 L2,10 L2,2 Z M2,12 L10,12 L10,18 L2,18 L2,12 Z M30,12 L38,12 L38,18 L30,18 L30,12 Z M12,22 L28,22 L28,28 L12,28 L12,22 Z M30,20 L38,20 L38,28 L30,28 L30,20 Z M2,20 L10,20 L10,28 L2,28 L2,20 Z" />
                            </svg>
                          </div>
                          <div className="font-black italic text-xl tracking-wider">{card.cardNetwork}</div>
                        </div>
                        <div className="z-20">
                          <div className="font-mono text-lg tracking-[0.15em] mb-2 flex justify-between items-center">
                            <span>{card.maskedNumber}</span>
                            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded uppercase tracking-widest">{card.cardType}</span>
                          </div>
                          <div className="flex justify-between items-end">
                            <div className="font-medium text-sm tracking-wide">{user?.firstName || "Card Holder"}</div>
                            <div className="font-mono text-sm tracking-wider">{new Date(card.expiryDate).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' })}</div>
                          </div>
                        </div>
                      </div>

                      {/* --- BACK FACE --- */}
                      <div className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl overflow-hidden flex flex-col shadow-lg ${getCardStyle(card.cardType, card.cardNetwork, card.currentStatus === 'Blocked')}`}>
                         <div className="w-full h-12 bg-black/80 mt-6"></div>
                         <div className="px-6 mt-4">
                             <div className="w-full h-10 bg-white/90 rounded flex items-center justify-end px-4 text-black font-mono font-bold">
                                 CVV: {card._id.slice(-3).replace(/[a-z]/gi, '7')} {/* Pseudo-random CVV based on ID */}
                             </div>
                             <p className="text-[9px] text-white/60 mt-3 text-center leading-tight">
                               Found this card? Please return to VaultPay Bank. Issued subject to terms and conditions. Call 1-800-VAULT for support.
                             </p>
                         </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details Pane */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            {selectedCard && (
              <>
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{selectedCard.cardNetwork} {selectedCard.cardType}</h2>
                    <p className="text-sm text-gray-500 font-mono">Ending in {selectedCard.maskedNumber.slice(-4)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${selectedCard.currentStatus === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {selectedCard.currentStatus}
                    </span>
                    <button onClick={() => handleToggleStatus(selectedCard._id, selectedCard.currentStatus)} className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                      {selectedCard.currentStatus === 'Active' ? 'Freeze Card' : 'Unfreeze Card'}
                    </button>
                  </div>
                </div>

                <div className="flex border-b border-gray-200 bg-white">
                  <button onClick={() => setActiveTab("controls")} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'controls' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Settings & Controls</button>
                  <button onClick={() => setActiveTab("transactions")} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'transactions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Recent Transactions</button>
                </div>
                
                <div className="p-6 flex-1 overflow-y-auto bg-gray-50/30">
                  {activeTab === "controls" && (
                    <div className="space-y-6 animate-fade-in">
                      
                      {/* --- OVERDUE BILLS SECTION (CREDIT CARDS ONLY) --- */}
                      {selectedCard.cardType === 'Credit' && (
                        <div className="bg-red-50 p-5 rounded-xl border border-red-200 shadow-sm animate-slide-in-from-bottom">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                            <div>
                              <h4 className="text-base font-bold text-red-900 uppercase tracking-wider flex items-center gap-2">
                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                Overdue Bill
                              </h4>
                              <p className="text-xs text-red-700 mt-1">Payment was due on the 1st of this month.</p>
                            </div>
                            <div className="flex items-center gap-4">
                               <div className="text-right">
                                 <p className="font-bold text-red-900 text-2xl">₹ {(selectedCard.limits?.outstandingAmount || 14500).toLocaleString()}</p>
                               </div>
                               <Button variant="danger" size="sm" className="shadow-md whitespace-nowrap">Pay Now</Button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4 border-b border-gray-100 pb-4">
                          <div>
                            <h4 className="text-base font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                              Spending Limits
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">Control your daily transaction caps.</p>
                          </div>
                          <Button variant="primary" size="sm" onClick={() => openLimitModal(selectedCard)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            Edit Limits
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/50">
                            <p className="text-xs text-gray-500 mb-1 font-medium">Daily Online</p>
                            <p className="font-bold text-gray-900 text-xl">₹ {selectedCard.limits?.dailyOnlineLimit?.toLocaleString() || "100,000"}</p>
                          </div>
                          <div className="border border-indigo-100 rounded-xl p-4 bg-indigo-50/50">
                            <p className="text-xs text-gray-500 mb-1 font-medium">Daily ATM</p>
                            <p className="font-bold text-gray-900 text-xl">₹ {selectedCard.limits?.dailyWithdrawalLimit?.toLocaleString() || "50,000"}</p>
                          </div>
                          <div className="border border-teal-100 rounded-xl p-4 bg-teal-50/50">
                            <p className="text-xs text-gray-500 mb-1 font-medium">Contactless</p>
                            <p className="font-bold text-gray-900 text-xl">₹ {selectedCard.limits?.contactlessLimit?.toLocaleString() || "5,000"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Security Features</h4>
                        <div className="space-y-3">
                          
                          {/* FULLY FUNCTIONAL TOGGLE 1 */}
                          <div 
                            className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => setIsOnlineTxnEnabled(!isOnlineTxnEnabled)}
                          >
                            <div>
                              <p className="text-sm font-semibold text-gray-900">Online Transactions</p>
                              <p className="text-xs text-gray-500">Allow payments on e-commerce sites.</p>
                            </div>
                            <div className={`w-11 h-6 rounded-full relative shadow-inner transition-colors duration-300 ${isOnlineTxnEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
                               <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow transition-transform duration-300 ${isOnlineTxnEnabled ? 'translate-x-6' : 'translate-x-1'}`}></div>
                            </div>
                          </div>

                          {/* FULLY FUNCTIONAL TOGGLE 2 */}
                          <div 
                            className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => setIsIntlTxnEnabled(!isIntlTxnEnabled)}
                          >
                            <div>
                              <p className="text-sm font-semibold text-gray-900">International Usage</p>
                              <p className="text-xs text-gray-500">Allow transactions in foreign currencies.</p>
                            </div>
                            <div className={`w-11 h-6 rounded-full relative shadow-inner transition-colors duration-300 ${isIntlTxnEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
                               <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow transition-transform duration-300 ${isIntlTxnEnabled ? 'translate-x-6' : 'translate-x-1'}`}></div>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "transactions" && (
                     <div className="animate-fade-in space-y-4">
                       <div className="text-center p-6 text-gray-500 border border-gray-100 rounded-xl bg-white shadow-sm">
                         No recent transactions found for this card.
                       </div>
                     </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Modal isOpen={isRequestModalOpen} onClose={() => !isGenerating && setIsRequestModalOpen(false)} title="Create New Card">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Card Type</label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={newCardType} onChange={(e) => setNewCardType(e.target.value)} disabled={isGenerating}>
              <option value="Debit">Debit Card</option>
              <option value="Credit">Credit Card</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Card Network</label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={newCardNetwork} onChange={(e) => setNewCardNetwork(e.target.value)} disabled={isGenerating}>
              <option value="Visa">Visa</option>
              <option value="MasterCard">MasterCard</option>
              <option value="Amex">American Express</option>
              <option value="RuPay">RuPay</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-4">
            <Button type="button" variant="ghost" onClick={() => setIsRequestModalOpen(false)} disabled={isGenerating}>Cancel</Button>
            <Button type="button" variant="primary" onClick={handleRequestCard} isLoading={isGenerating}>Generate Card</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isLimitModalOpen} onClose={() => !isSubmittingLimits && setIsLimitModalOpen(false)} title="Edit Card Limits">
        <form onSubmit={handleUpdateLimits} className="space-y-4">
            <Input label="Daily Online Limit" type="number" value={onlineLimit} onChange={(e) => setOnlineLimit(e.target.value)} required disabled={isSubmittingLimits} />
            <Input label="Daily ATM Limit" type="number" value={atmLimit} onChange={(e) => setAtmLimit(e.target.value)} required disabled={isSubmittingLimits} />
            <Input label="Contactless Limit" type="number" value={contactlessLimit} onChange={(e) => setContactlessLimit(e.target.value)} required disabled={isSubmittingLimits} />
            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-4">
                <Button type="button" variant="ghost" onClick={() => setIsLimitModalOpen(false)} disabled={isSubmittingLimits}>Cancel</Button>
                <Button type="submit" variant="primary" isLoading={isSubmittingLimits}>Save Changes</Button>
            </div>
        </form>
      </Modal>
    </div>
  );
}