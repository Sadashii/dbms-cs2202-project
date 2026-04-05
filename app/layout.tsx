import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

// Adjust this import path based on exactly where you saved AuthProvider
import AuthProvider from "@/components/AuthProvider"; 

// Using Inter for a clean, professional financial/banking look
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "VaultPay | Enterprise Banking",
  description: "Secure, scalable enterprise fintech platform.",
  // Prevent indexing of the dashboard by search engines (best practice for fintech)
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // `h-full` and `antialiased` are critical here for the Sidebar/Navbar 
    // to fill the screen correctly without visual artifacts.
    <html lang="en" className="h-full antialiased">
      <body className={`${inter.className} h-full bg-slate-50 text-slate-900 flex flex-col`}>
        {/* The AuthProvider manages the Navbar, Loading States, and Children */}
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}