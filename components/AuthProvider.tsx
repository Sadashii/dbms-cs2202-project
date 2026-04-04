"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth"
import { Navbar } from "@/components/Navbar"

// 1. Infer the type from your custom hook automatically
type AuthContextType = ReturnType<typeof useAuth>;

// 2. Create the Context
export const AuthContext = createContext<AuthContextType | null>(null);

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize the auth hook ONLY ONCE here at the root level
  const auth = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch errors between server and client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show a professional loading state while verifying the session
  if (!isMounted || auth.isLoading) {
    return (
      <AuthContext.Provider value={auth}> {/* <--- ADD THIS WRAPPER */}
        <div className="min-h-screen flex flex-col bg-slate-50">
          <Navbar />
          <div className="flex flex-1 items-center justify-center flex-col">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-sm text-gray-500 animate-pulse">Authenticating securely...</p>
          </div>
        </div>
      </AuthContext.Provider>
    );
  }

  // Provide the auth object to the entire application tree
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

// 3. Export a strict consumer hook for your components to use
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};