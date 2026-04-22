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
            case "active":
                return "bg-green-500";
            case "inactive":
                return "bg-gray-400";
            case "frozen":
                return "bg-blue-500";
            case "blocked":
                return "bg-red-600";
            default:
                return "bg-gray-500";
        }
    };

    return (
        <div
            className="relative w-full max-w-[340px] h-[215px] cursor-pointer group"
            style={{ perspective: "1000px" }}
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <div
                className="w-full h-full transition-transform duration-700 ease-in-out shadow-xl dark:shadow-slate-900/60 rounded-2xl relative"
                style={{
                    transformStyle: "preserve-3d",
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
            >
                {}
                <div
                    className={`absolute inset-0 w-full h-full rounded-2xl p-6 text-white flex flex-col justify-between border ${card.type === "credit" ? "bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700" : "bg-gradient-to-br from-indigo-600 to-blue-500 border-indigo-500/50"} ${card.status === "blocked" ? "opacity-75 grayscale" : ""}`}
                    style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                    }}
                >
                    <div className="flex justify-between items-start">
                        <span className="uppercase tracking-widest font-bold text-xs opacity-90 drop-shadow-sm">
                            {card.type}
                        </span>
                        <div className="flex items-center gap-2 bg-black/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
                            <span
                                className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${getStatusColor(card.status)}`}
                            ></span>
                            <span className="text-[10px] uppercase tracking-wider font-semibold opacity-100">
                                {card.status}
                            </span>
                        </div>
                    </div>

                    <div className="font-mono text-2xl tracking-[0.15em] mt-2 drop-shadow-md">
                        {card.maskedNumber}
                    </div>

                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[9px] opacity-70 uppercase tracking-widest mb-1">
                                Card Holder
                            </p>
                            <p className="font-medium text-sm tracking-widest uppercase drop-shadow-sm">
                                VaultPay User
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] opacity-70 uppercase tracking-widest mb-1">
                                Expires
                            </p>
                            <p className="font-mono text-sm drop-shadow-sm">
                                {formatExpiry(card.expiryDate)}
                            </p>
                        </div>
                    </div>
                </div>

                {}
                <div
                    className={`absolute inset-0 w-full h-full rounded-2xl text-white overflow-hidden flex flex-col border ${card.type === "credit" ? "bg-slate-800 border-slate-700" : "bg-indigo-900 border-indigo-700"}`}
                    style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                    }}
                >
                    {}
                    <div className="w-full h-12 bg-black/80 mt-6 shadow-inner"></div>

                    <div className="px-6 flex-1 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mt-2">
                            {}
                            <div className="flex-1 h-8 bg-gray-200 rounded text-black flex items-center px-3 overflow-hidden relative">
                                <div
                                    className="absolute inset-0 opacity-10"
                                    style={{
                                        backgroundImage:
                                            "repeating-linear-gradient(45deg, transparent, transparent 2px, #000 2px, #000 4px)",
                                    }}
                                ></div>
                                <span className="text-gray-500 opacity-60 text-[10px] italic z-10">
                                    Authorized Signature
                                </span>
                            </div>
                            {}
                            <div className="bg-white text-black h-8 w-12 rounded flex items-center justify-center font-mono font-bold shadow-sm">
                                ***
                            </div>
                        </div>
                        <p className="text-[9px] text-white/50 mt-5 text-center leading-relaxed">
                            This card is property of VaultPay Bank. <br />
                            If found, please return to the nearest branch.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
