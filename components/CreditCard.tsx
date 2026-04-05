"use client";

import { useState } from "react";

interface CreditCardProps {
  card: {
    _id: string;
    maskedNumber: string;
    expiryDate: string;
    type: string;
    status: string;
  };
}

export default function CreditCard({ card }: CreditCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const formatExpiry = (dateString: string) => {
    const d = new Date(dateString);
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "inactive": return "bg-gray-400";
      case "frozen": return "bg-blue-500";
      case "blocked": return "bg-red-600";
      default: return "bg-gray-500";
    }
  };

  return (
    <div 
      className="relative w-full max-w-[340px] h-[215px] cursor-pointer group perspective-1000"
      style={{ perspective: "1000px" }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div 
        className={`w-full h-full transition-transform duration-700 shadow-xl rounded-2xl ${isFlipped ? 'rotate-y-180' : ''}`}
        style={{ transformStyle: "preserve-3d", transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        {/* FRONT SIDE */}
        <div 
          className={`absolute inset-0 w-full h-full rounded-2xl p-6 text-white flex flex-col justify-between ${card.type === 'credit' ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-indigo-600 to-blue-500'} ${card.status === 'blocked' ? 'opacity-75 grayscale' : ''}`}
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
        >
          <div className="flex justify-between items-start">
            <span className="uppercase tracking-widest font-bold text-xs opacity-80">{card.type}</span>
            <div className="flex items-center gap-2">
               <span className={`w-2 h-2 rounded-full ${getStatusColor(card.status)}`}></span>
               <span className="text-xs capitalize font-medium opacity-90">{card.status}</span>
            </div>
          </div>
          
          <div className="font-mono text-xl tracking-[0.15em] mt-4">{card.maskedNumber}</div>
          
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] opacity-60 uppercase mb-1">Card Holder</p>
              <p className="font-medium text-sm tracking-wide">VaultPay User</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] opacity-60 uppercase mb-1">Expires</p>
              <p className="font-mono text-sm">{formatExpiry(card.expiryDate)}</p>
            </div>
          </div>
        </div>

        {/* BACK SIDE */}
        <div 
          className="absolute inset-0 w-full h-full rounded-2xl bg-slate-800 text-white overflow-hidden"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="w-full h-12 bg-black mt-6 opacity-80"></div>
          <div className="px-6 mt-4">
            <p className="text-right text-xs opacity-60 mb-1">CVV</p>
            <div className="bg-white text-black h-8 w-full rounded flex items-center justify-end px-3 font-mono font-bold">
              ***
            </div>
            <p className="text-[10px] text-gray-400 mt-4 text-center">
              Tap card to flip back. Keep your card details secure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}