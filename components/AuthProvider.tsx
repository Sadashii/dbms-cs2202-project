"use client";

import React, { createContext, useContext } from "react";
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

  // Provide the auth object to the entire application tree
  return (
    <AuthContext.Provider value={auth}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
        <Navbar />
        <main className="flex-1 flex flex-col w-full h-full">
          {auth.isLoading ? (
            <div className="flex flex-1 items-center justify-center flex-col">
              <div className="mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                Authenticating securely...
              </p>
            </div>
          ) : (
            children
          )}
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
