
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthContext } from "./AuthProvider";

// ─── Types ───────────────────────────────────────────────────────────────────

type NavItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
};

type NavSection = {
  title: string;
  role: "Customer" | "Employee" | "Manager" | "Admin";
  items: NavItem[];
  color: string; // Thematic color for this section
};

// ─── Icons ───────────────────────────────────────────────────────────────────

const Icons = {
  Dashboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
  ),
  Accounts: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
  ),
  Cards: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
  ),
  Loans: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ),
  Support: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
  ),
  Shield: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
  ),
  Audit: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
  ),
  Menu: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
  ),
  Close: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
  ),
};

// ─── Data Groups ─────────────────────────────────────────────────────────────

const navigationSections: NavSection[] = [
  {
    title: "Customer Options",
    role: "Customer",
    color: "blue",
    items: [
      { name: "Overview", href: "/my/overview", icon: Icons.Dashboard },
      { name: "Accounts", href: "/my/accounts", icon: Icons.Accounts },
      { name: "Cards", href: "/my/cards", icon: Icons.Cards },
      { name: "Loans", href: "/my/loans", icon: Icons.Loans },
      { name: "Support Tickets", href: "/my/support", icon: Icons.Support },
    ],
  },
  {
    title: "Employee Options",
    role: "Employee",
    color: "amber",
    items: [
      { name: "Account Requests", href: "/admin/accountrequests", icon: Icons.Shield },
      { name: "Deposit Funds", href: "/admin/deposit", icon: Icons.Accounts },
      { name: "Withdraw Funds", href: "/admin/withdraw", icon: Icons.Accounts },
      { name: "Loan Requests", href: "/admin/loans", icon: Icons.Loans },
      { name: "Support Admin", href: "/admin/support", icon: Icons.Support },
      { name: "KYC Approvals", href: "/admin/kyc", icon: Icons.Shield },
    ],
  },
  {
    title: "Manager Options",
    role: "Manager",
    color: "indigo",
    items: [
      { name: "Audit Logs", href: "/admin/audit", icon: Icons.Audit },
    ],
  },
  {
    title: "Admin Options",
    role: "Admin",
    color: "rose",
    items: [
      { name: "Branch Management", href: "/admin/branches", icon: Icons.Dashboard },
    ],
  },
];

// Helper to determine if a section should be shown based on user role
function canUserSeeSection(userRole: string, sectionRole: string): boolean {
  const roles = ["Customer", "Employee", "Manager", "Admin"];
  const userRank = roles.indexOf(userRole);
  const sectionRank = roles.indexOf(sectionRole);
  return userRank >= sectionRank;
}

// ─── Components ──────────────────────────────────────────────────────────────

function NavList({ pathname, userRole, onNavClick }: {
  pathname: string;
  userRole: string;
  onNavClick?: () => void;
}) {
  return (
    <nav className="flex-1 px-4 space-y-6" aria-label="Sidebar">
      {navigationSections.map((section) => {
        if (!canUserSeeSection(userRole, section.role)) return null;

        return (
          <div key={section.title} className="space-y-1.5">
            {/* [role] tag header */}
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded border 
                ${section.color === "blue" ? "bg-blue-50 text-blue-600 border-blue-100" : ""}
                ${section.color === "amber" ? "bg-amber-50 text-amber-600 border-amber-100" : ""}
                ${section.color === "indigo" ? "bg-indigo-50 text-indigo-600 border-indigo-100" : ""}
                ${section.color === "rose" ? "bg-rose-50 text-rose-600 border-rose-100" : ""}
              `}>
                [{section.role}] Options
              </span>
              <div className={`h-[1px] flex-1 ml-3 
                ${section.color === "blue" ? "bg-blue-50" : ""}
                ${section.color === "amber" ? "bg-amber-50" : ""}
                ${section.color === "indigo" ? "bg-indigo-50" : ""}
                ${section.color === "rose" ? "bg-rose-50" : ""}
              `} />
            </div>

            {section.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavClick}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 relative
                    ${isActive 
                      ? "bg-slate-50 text-gray-900 shadow-sm border border-slate-100" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }
                  `}
                >
                  {/* Active Indicator Bar */}
                  {isActive && (
                    <div className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full
                      ${section.color === "blue" ? "bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]" : ""}
                      ${section.color === "amber" ? "bg-amber-600 shadow-[0_0_8px_rgba(217,119,6,0.4)]" : ""}
                      ${section.color === "indigo" ? "bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.4)]" : ""}
                      ${section.color === "rose" ? "bg-rose-600 shadow-[0_0_8_rgba(225,29,72,0.4)]" : ""}
                    `} />
                  )}

                  <div className={`mr-3 flex-shrink-0 transition-all duration-200 p-1.5 rounded-md
                    ${isActive 
                      ? `${section.color === "blue" ? "bg-blue-100 text-blue-600" : ""}
                         ${section.color === "amber" ? "bg-amber-100 text-amber-600" : ""}
                         ${section.color === "indigo" ? "bg-indigo-100 text-indigo-600" : ""}
                         ${section.color === "rose" ? "bg-rose-100 text-rose-600" : ""}`
                      : "text-gray-400 group-hover:text-gray-500"
                    }
                  `}>
                    {item.icon}
                  </div>
                  {item.name}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

export const Sidebar = () => {
  const { user } = useAuthContext();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileOpen]);

  if (!user) return null;

  const statusFooter = (
    <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-slate-50/50">
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse ring-4 ring-green-50" />
        <div>
          <p className="text-[11px] font-bold text-gray-900 uppercase tracking-tighter">System Health</p>
          <p className="text-[10px] text-gray-500 font-medium">Operational · Core Online</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Trigger */}
      <button
        className="md:hidden fixed bottom-6 right-6 z-50 bg-blue-600 text-white rounded-full p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-blue-700 transition-all active:scale-95"
        onClick={() => setIsMobileOpen(true)}
      >
        {Icons.Menu}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Mobile Drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex flex-col">
            <span className="text-xl font-black text-gray-900 tracking-tighter">VaultPay</span>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{user.role} ACCESS</span>
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="text-gray-400 hover:text-gray-700">{Icons.Close}</button>
        </div>
        <div className="flex-1 overflow-y-auto py-6">
          <NavList pathname={pathname} userRole={user.role} onNavClick={() => setIsMobileOpen(false)} />
        </div>
        {statusFooter}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 h-[calc(100vh-4rem)] sticky top-16 shrink-0 shadow-[1px_0_0_rgb(0,0,0,0.02)]">
        <div className="flex flex-col flex-grow pt-4 pb-4 overflow-y-auto custom-scrollbar">
          <NavList pathname={pathname} userRole={user.role} />
        </div>
        {statusFooter}
      </aside>
    </>
  );
};