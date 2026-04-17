"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthContext } from "./AuthProvider";
import ThemeToggle from "./ThemeToggle"; // <-- Imported the toggle here

export const Navbar = () => {
  const { isLoggedIn, user, logout, isLoading, apiFetch } = useAuthContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout("/auth/login");
  };

  const isActive = (path: string) => pathname === path;

  const fetchNotifications = async () => {
    if (!isLoggedIn) return;
    try {
      const res = await apiFetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [isLoggedIn, apiFetch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
            setIsNotifOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id?: string) => {
      try {
          const body = id ? { notificationId: id } : { markAll: true };
          const res = await apiFetch("/api/notifications", {
              method: "PATCH",
              body: JSON.stringify(body)
          });
          if (res.ok) {
              fetchNotifications();
          }
      } catch (e) {
          console.error(e);
      }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
                    
                    {/* Notification Bell */}
                    <div className="relative" ref={notifRef}>
                        <button 
                            onClick={() => setIsNotifOpen(!isNotifOpen)}
                            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none relative transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-600 border-2 border-white rounded-full text-white text-[9px] font-bold shadow-sm animate-pulse">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {isNotifOpen && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in origin-top-right">
                                <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                    <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <button onClick={() => handleMarkAsRead()} className="text-xs text-blue-600 hover:underline">Mark all read</button>
                                    )}
                                </div>
                                <div className="max-h-[70vh] overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-6 text-center text-gray-500 text-sm flex flex-col items-center">
                                            <svg className="w-10 h-10 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                                            No notifications
                                        </div>
                                    ) : (
                                        notifications.map((notif) => (
                                            <div 
                                                key={notif._id} 
                                                className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-3 ${!notif.isRead ? 'bg-blue-50/30' : 'opacity-70'}`}
                                            >
                                                <div className="mt-0.5">
                                                    {notif.type === 'System' ? <div className="w-2 h-2 rounded-full bg-blue-500"></div> :
                                                     notif.type === 'Alert' ? <div className="w-2 h-2 rounded-full bg-red-500"></div> :
                                                     <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`text-sm ${!notif.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{notif.title}</p>
                                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{notif.body}</p>
                                                    <p className="text-[10px] text-gray-400 mt-2 font-mono">{new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {new Date(notif.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                {!notif.isRead && (
                                                    <button onClick={() => handleMarkAsRead(notif._id)} className="text-blue-500 hover:bg-blue-100 p-1.5 rounded-md h-fit" title="Mark as read">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="h-6 w-px bg-gray-200 mx-2"></div>

                    <div className="flex flex-col items-end">
                      <span className="text-sm font-medium text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
                    </div>
                    
                    {/* User Avatar Circle */}
                    <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </div>

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
              {isLoggedIn && (
                  <button 
                  onClick={() => setIsNotifOpen(true)}
                  className="p-2 rounded-md text-gray-400 relative"
                  >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  {unreadCount > 0 && <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-red-600 rounded-full border border-white"></span>}
                  </button>
              )}
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