"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthContext } from "./AuthProvider";

// --- Types ---
type NavItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
  allowedRoles: Array<"Customer" | "Employee" | "Manager" | "Admin">;
};

// --- SVG Icons (Zero Dependency) ---
const Icons = {
  Dashboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
  ),
  Accounts: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
  ),
  Cards: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
  ),
  Loans: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ),
  Support: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
  ),
  Shield: ( // For KYC / Admin
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
  ),
  Audit: ( // For Audit Logs
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
  ),
};

// --- Navigation Configuration ---
const navigation: NavItem[] = [
  // Customer Routes
  { name: "Overview", href: "/my", icon: Icons.Dashboard, allowedRoles: ["Customer", "Employee", "Manager", "Admin"] },
  { name: "Accounts", href: "/my/accounts", icon: Icons.Accounts, allowedRoles: ["Customer", "Employee", "Manager", "Admin"] },
  { name: "Cards", href: "/my/cards", icon: Icons.Cards, allowedRoles: ["Customer", "Employee", "Manager", "Admin"] },
  { name: "Loans", href: "/my/loans", icon: Icons.Loans, allowedRoles: ["Customer", "Employee", "Manager", "Admin"] },
  { name: "Support Tickets", href: "/my/support", icon: Icons.Support, allowedRoles: ["Customer", "Employee", "Manager", "Admin"] },
  
  // Back-office / Admin Routes
  { name: "KYC Approvals", href: "/admin/kyc", icon: Icons.Shield, allowedRoles: ["Employee", "Manager", "Admin"] },
  { name: "Audit Logs", href: "/admin/audit", icon: Icons.Audit, allowedRoles: ["Manager", "Admin"] },
  { name: "Branch Management", href: "/admin/branches", icon: Icons.Dashboard, allowedRoles: ["Admin"] },
];

export const Sidebar = () => {
  const { user } = useAuthContext();
  const pathname = usePathname();

  // If no user is logged in, or we are loading, return null (Sidebar shouldn't render)
  if (!user) return null;

  // Filter navigation items based on the user's role
  const userRole = user.role as "Customer" | "Employee" | "Manager" | "Admin";
  const filteredNav = navigation.filter((item) => item.allowedRoles.includes(userRole));

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-[calc(100vh-4rem)] sticky top-16 shrink-0">
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
        
        {/* User Role Badge (Optional, good for enterprise context) */}
        <div className="px-6 mb-6">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wider">
            {user.role} Portal
          </span>
        </div>

        <nav className="flex-1 px-4 space-y-1 bg-white" aria-label="Sidebar">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-150 ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <div
                  className={`mr-3 flex-shrink-0 transition-colors duration-150 ${
                    isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-500"
                  }`}
                >
                  {item.icon}
                </div>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer (Optional: Quick Help or Status) */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-green-50 flex items-center justify-center">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse"></div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-900">System Status</p>
            <p className="text-xs text-gray-500">All services operational</p>
          </div>
        </div>
      </div>
    </aside>
  );
};