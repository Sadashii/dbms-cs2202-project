"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthContext } from "./AuthProvider";
import ThemeToggle from "./ThemeToggle"; // <-- Imported the toggle here

export const Navbar = () => {
  const { isLoggedIn, user, logout, isLoading } = useAuthContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout("/auth/login");
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 shadow-sm sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side - Logo & Desktop Links */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl leading-none">V</span>
                </div>
                <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  VaultPay
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              {isLoggedIn ? (
                <>
                  <NavLink href="/my/overview" active={isActive("/my/overview")}>Dashboard</NavLink>
                  <NavLink href="/my/accounts" active={isActive("/my/accounts")}>Accounts</NavLink>
                  <NavLink href="/my/cards" active={isActive("/my/cards")}>Cards</NavLink>
                </>
              ) : (
                <>
                  <NavLink href="/" active={isActive("/")}>Home</NavLink>
                  <NavLink href="/features" active={isActive("/features")}>Features</NavLink>
                  <NavLink href="/corporate" active={isActive("/corporate")}>Corporate</NavLink>
                </>
              )}
            </div>
          </div>

          {/* Right side - User Actions & Mobile Toggle */}
          <div className="flex items-center">
            <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
              
              {/* Dark Mode Toggle Button */}
              <ThemeToggle />

              {!isLoading && (
                isLoggedIn ? (
                  <div className="flex items-center gap-4">
  {/* Wrapped Name and Avatar in a Link */}
  <Link href="/my/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
    <div className="flex flex-col items-end">
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {user?.firstName} {user?.lastName}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</span>
    </div>
    
    {/* User Avatar Circle */}
    <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800">
      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
    </div>
  </Link>

  {/* Logout stays exactly as it was */}
  <button
    onClick={handleLogout}
    className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 transition-colors ml-2 border-l border-gray-200 dark:border-slate-700 pl-4"
  >
    Logout
  </button>
</div>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-all active:scale-95"
                    >
                      Open Account
                    </Link>
                  </>
                )
              )}
            </div>

            {/* Mobile menu button */}
            <div className="-mr-2 flex items-center sm:hidden gap-2">
              <ThemeToggle />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                {!isMobileMenuOpen ? (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="pt-2 pb-3 space-y-1">
            {isLoggedIn ? (
              <>
                <MobileNavLink href="/my/overview" active={isActive("/my/overview")}>Dashboard</MobileNavLink>
                <MobileNavLink href="/my/accounts" active={isActive("/my/accounts")}>Accounts</MobileNavLink>
                <MobileNavLink href="/my/cards" active={isActive("/my/cards")}>Cards</MobileNavLink>
              </>
            ) : (
              <>
                <MobileNavLink href="/" active={isActive("/")}>Home</MobileNavLink>
                <MobileNavLink href="/features" active={isActive("/features")}>Features</MobileNavLink>
              </>
            )}
          </div>
          
          {/* Mobile Auth Section */}
          {!isLoading && (
            <div className="pt-4 pb-4 border-t border-gray-200 dark:border-slate-800">
              {isLoggedIn ? (
                <div className="flex items-center px-4 justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </div>
                    <div>
                      <div className="text-base font-medium text-gray-800 dark:text-gray-200">{user?.firstName} {user?.lastName}</div>
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{user?.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="mt-3 w-full block text-left text-base font-medium text-red-600 dark:text-red-500 py-2 hover:bg-gray-50 dark:hover:bg-slate-900"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="px-4 flex flex-col gap-2">
                  <Link href="/auth/login" className="block text-center w-full bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-slate-700 px-4 py-2 rounded-md font-medium">
                    Sign In
                  </Link>
                  <Link href="/auth/signup" className="block text-center w-full bg-blue-600 text-white px-4 py-2 rounded-md font-medium">
                    Open Account
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

// --- Helper Components for cleaner code ---

const NavLink = ({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) => (
  <Link
    href={href}
    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
      active
        ? "border-blue-600 text-gray-900 dark:text-white"
        : "border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-700 hover:text-gray-700 dark:hover:text-gray-300"
    }`}
  >
    {children}
  </Link>
);

const MobileNavLink = ({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) => (
  <Link
    href={href}
    className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
      active
        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-600 text-blue-700 dark:text-blue-400"
        : "border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-900 hover:border-gray-300 dark:hover:border-slate-700 hover:text-gray-800 dark:hover:text-gray-200"
    }`}
  >
    {children}
  </Link>
);