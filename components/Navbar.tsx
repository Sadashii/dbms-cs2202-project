"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "./AuthProvider";
import ThemeToggle from "./ThemeToggle";

export const Navbar = () => {
    const { isLoggedIn, user, logout, isLoading, apiFetch } = useAuthContext();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

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
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [isLoggedIn, apiFetch]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                notifRef.current &&
                !notifRef.current.contains(event.target as Node)
            ) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id?: string) => {
        try {
            const body = id ? { notificationId: id } : { markAll: true };
            const res = await apiFetch("/api/notifications", {
                method: "PATCH",
                body: JSON.stringify(body),
            });
            if (res.ok) {
                fetchNotifications();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleNotificationClick = async (notification: any) => {
        if (!notification?.isRead) {
            await handleMarkAsRead(notification._id);
        }

        if (notification?.actionUrl) {
            setIsNotifOpen(false);
            router.push(notification.actionUrl);
        }
    };

    const unreadCount = notifications.filter((n) => !n.isRead).length;
    const isCustomer = user?.role === "Customer";

    return (
        <nav className="bg-white dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 shadow-sm sticky top-0 z-50 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {}
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/" className="flex items-center gap-2">
                                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-xl leading-none">
                                        V
                                    </span>
                                </div>
                                <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                                    VaultPay
                                </span>
                            </Link>
                        </div>

                        <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                            {isLoggedIn ? (
                                isCustomer ? (
                                    <>
                                        <NavLink
                                            href="/my/overview"
                                            active={isActive("/my/overview")}
                                        >
                                            Overview
                                        </NavLink>
                                        <NavLink
                                            href="/my/accounts"
                                            active={isActive("/my/accounts")}
                                        >
                                            Accounts
                                        </NavLink>
                                        <NavLink
                                            href="/my/cards"
                                            active={isActive("/my/cards")}
                                        >
                                            Cards
                                        </NavLink>
                                        <NavLink
                                            href="/my/loans"
                                            active={isActive("/my/loans")}
                                        >
                                            Loans
                                        </NavLink>
                                        <NavLink
                                            href="/my/support"
                                            active={isActive("/my/support")}
                                        >
                                            Support
                                        </NavLink>
                                        <NavLink
                                            href="/my/beneficiaries"
                                            active={isActive(
                                                "/my/beneficiaries",
                                            )}
                                        >
                                            Saved Recipients
                                        </NavLink>
                                    </>
                                ) : null
                            ) : (
                                <>
                                    <NavLink href="/" active={isActive("/")}>
                                        Home
                                    </NavLink>
                                    <NavLink
                                        href="/features"
                                        active={isActive("/features")}
                                    >
                                        Features
                                    </NavLink>
                                </>
                            )}
                        </div>
                    </div>

                    {}
                    <div className="flex items-center">
                        <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
                            <ThemeToggle />

                            {!isLoading &&
                                (isLoggedIn ? (
                                    <div className="flex items-center gap-4">
                                        {}
                                        <div
                                            className="relative"
                                            ref={notifRef}
                                        >
                                            <button
                                                onClick={() =>
                                                    setIsNotifOpen(!isNotifOpen)
                                                }
                                                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white focus:outline-none relative transition-colors"
                                            >
                                                <svg
                                                    className="w-6 h-6"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                                    />
                                                </svg>
                                                {unreadCount > 0 && (
                                                    <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-600 border-2 border-white dark:border-slate-950 rounded-full text-white text-[9px] font-bold shadow-sm animate-pulse">
                                                        {unreadCount > 99
                                                            ? "99+"
                                                            : unreadCount}
                                                    </span>
                                                )}
                                            </button>

                                            {}
                                            {isNotifOpen && (
                                                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden z-50 animate-fade-in origin-top-right transition-colors">
                                                    <div className="p-3 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
                                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                                            Notifications
                                                        </h3>
                                                        {unreadCount > 0 && (
                                                            <button
                                                                onClick={() =>
                                                                    handleMarkAsRead()
                                                                }
                                                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                                            >
                                                                Mark all read
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                                                        {notifications.length ===
                                                        0 ? (
                                                            <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm flex flex-col items-center">
                                                                No notifications
                                                            </div>
                                                        ) : (
                                                            notifications.map(
                                                                (notif) => (
                                                                    <button
                                                                        key={
                                                                            notif._id
                                                                        }
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleNotificationClick(
                                                                                notif,
                                                                            )
                                                                        }
                                                                        className={`w-full p-4 border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors flex gap-3 text-left ${!notif.isRead ? "bg-blue-50/30 dark:bg-blue-900/10" : "opacity-70"}`}
                                                                    >
                                                                        <div className="flex-1">
                                                                            <p
                                                                                className={`text-sm ${!notif.isRead ? "font-bold text-gray-900 dark:text-white" : "font-medium text-gray-700 dark:text-gray-300"}`}
                                                                            >
                                                                                {
                                                                                    notif.title
                                                                                }
                                                                            </p>
                                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                                {
                                                                                    notif.body
                                                                                }
                                                                            </p>
                                                                            {notif.actionUrl && (
                                                                                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                                                                                    Open
                                                                                    linked
                                                                                    page
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </button>
                                                                ),
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="h-6 w-px bg-gray-200 dark:bg-slate-800 mx-2"></div>

                                        {}
                                        <Link
                                            href="/my/profile"
                                            className="flex items-center gap-3 group transition-opacity hover:opacity-80"
                                        >
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-medium text-gray-900 dark:text-white transition-colors">
                                                    {user?.firstName}{" "}
                                                    {user?.lastName}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                                    {user?.role}
                                                </span>
                                            </div>
                                            <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800 transition-colors">
                                                {user?.firstName?.charAt(0)}
                                                {user?.lastName?.charAt(0)}
                                            </div>
                                        </Link>

                                        <button
                                            onClick={handleLogout}
                                            className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 transition-colors ml-2 border-l border-gray-200 dark:border-slate-800 pl-4"
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
                                            Create New Account
                                        </Link>
                                    </>
                                ))}
                        </div>

                        {}
                        <div className="-mr-2 flex items-center sm:hidden gap-2">
                            <ThemeToggle />
                            <button
                                onClick={() =>
                                    setIsMobileMenuOpen(!isMobileMenuOpen)
                                }
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none transition-colors"
                            >
                                {!isMobileMenuOpen ? (
                                    <svg
                                        className="block h-6 w-6"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth="1.5"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                                        />
                                    </svg>
                                ) : (
                                    <svg
                                        className="block h-6 w-6"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth="1.5"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {}
            {isMobileMenuOpen && (
                <div className="sm:hidden border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-colors">
                    <div className="pt-2 pb-3 space-y-1">
                        {isLoggedIn ? (
                            isCustomer ? (
                                <>
                                    <MobileNavLink
                                        href="/my/overview"
                                        active={isActive("/my/overview")}
                                    >
                                        Overview
                                    </MobileNavLink>
                                    <MobileNavLink
                                        href="/my/accounts"
                                        active={isActive("/my/accounts")}
                                    >
                                        Accounts
                                    </MobileNavLink>
                                    <MobileNavLink
                                        href="/my/cards"
                                        active={isActive("/my/cards")}
                                    >
                                        Cards
                                    </MobileNavLink>
                                    <MobileNavLink
                                        href="/my/loans"
                                        active={isActive("/my/loans")}
                                    >
                                        Loans
                                    </MobileNavLink>
                                    <MobileNavLink
                                        href="/my/support"
                                        active={isActive("/my/support")}
                                    >
                                        Support
                                    </MobileNavLink>
                                    <MobileNavLink
                                        href="/my/beneficiaries"
                                        active={isActive("/my/beneficiaries")}
                                    >
                                        Saved Recipients
                                    </MobileNavLink>
                                    <MobileNavLink
                                        href="/my/profile"
                                        active={isActive("/my/profile")}
                                    >
                                        Profile
                                    </MobileNavLink>
                                </>
                            ) : (
                                <>
                                    <MobileNavLink
                                        href="/my/profile"
                                        active={isActive("/my/profile")}
                                    >
                                        Profile
                                    </MobileNavLink>
                                </>
                            )
                        ) : (
                            <>
                                <MobileNavLink href="/" active={isActive("/")}>
                                    Home
                                </MobileNavLink>
                                <MobileNavLink
                                    href="/features"
                                    active={isActive("/features")}
                                >
                                    Features
                                </MobileNavLink>
                            </>
                        )}
                    </div>

                    <div className="pt-4 pb-4 border-t border-gray-200 dark:border-slate-800">
                        {isLoggedIn ? (
                            <div className="px-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold">
                                        {user?.firstName?.charAt(0)}
                                        {user?.lastName?.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-base font-medium text-gray-800 dark:text-gray-200">
                                            {user?.firstName} {user?.lastName}
                                        </div>
                                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            {user?.email}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left font-medium text-red-600 dark:text-red-500 py-2"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="px-4 flex flex-col gap-2">
                                <Link
                                    href="/auth/login"
                                    className="block text-center w-full bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-slate-700 px-4 py-2 rounded-md font-medium"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="block text-center w-full bg-blue-600 text-white px-4 py-2 rounded-md font-medium"
                                >
                                    Create New Account
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

const NavLink = ({
    href,
    active,
    children,
}: {
    href: string;
    active: boolean;
    children: React.ReactNode;
}) => (
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

const MobileNavLink = ({
    href,
    active,
    children,
}: {
    href: string;
    active: boolean;
    children: React.ReactNode;
}) => (
    <Link
        href={href}
        className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${
            active
                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-600 text-blue-700 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-900 hover:border-gray-300 dark:hover:border-slate-700 hover:text-gray-800 dark:hover:text-gray-200"
        }`}
    >
        {children}
    </Link>
);
