"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";

type AuthContextType = ReturnType<typeof useAuth>;

export const AuthContext = createContext<AuthContextType | null>(null);

export default function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const auth = useAuth();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted || auth.isLoading) {
        return (
            <AuthContext.Provider value={auth}>
                {" "}
                {}
                <div className="min-h-screen flex flex-col bg-slate-50">
                    <Navbar />
                    <div className="flex flex-1 items-center justify-center flex-col">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-sm text-gray-500 animate-pulse">
                            Authenticating securely...
                        </p>
                    </div>
                </div>
            </AuthContext.Provider>
        );
    }

    return (
        <AuthContext.Provider value={auth}>
            <div className="min-h-screen flex flex-col bg-slate-50">
                <Navbar />
                <main className="flex-1 flex flex-col w-full h-full">
                    {children}
                </main>
            </div>
        </AuthContext.Provider>
    );
}

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuthContext must be used within an AuthProvider");
    }
    return context;
};
