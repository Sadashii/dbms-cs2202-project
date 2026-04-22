import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider"; 
import { ThemeProvider } from "@/components/ThemeProvider"; // <--- Added this import

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "VaultPay | Enterprise Banking",
  description: "Secure, scalable enterprise fintech platform.",
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
    // <--- Added suppressHydrationWarning
    <html lang="en" className="h-full antialiased" suppressHydrationWarning> 
      <body className={`${inter.className} h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex flex-col`}>
        {/* <--- Wrapped AuthProvider in ThemeProvider */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
