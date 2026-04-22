"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ThemeProvider } from "@/components/ThemeProvider";

const AuthProvider = dynamic(() => import("@/components/AuthProvider"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors" />
  ),
});

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
