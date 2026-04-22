import React from "react";
import { Button } from "@/components/ui/button";
import { TwoFactorModal } from "@/components/TwoFactorModal";
import { UpdatePasswordModal } from "@/components/UpdatePasswordModal";

interface SecurityTabProps {
    profile: any;
    setProfile: (profile: any) => void;
    sessions: any[];
    isPasswordModalOpen: boolean;
    setIsPasswordModalOpen: (isOpen: boolean) => void;
    isTwoFactorModalOpen: boolean;
    setIsTwoFactorModalOpen: (isOpen: boolean) => void;
    handleLogoutSession: (sessionId: string) => void;
    handleDisable2FA: () => void;
    apiFetch: any;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({
    profile,
    setProfile,
    sessions,
    isPasswordModalOpen,
    setIsPasswordModalOpen,
    isTwoFactorModalOpen,
    setIsTwoFactorModalOpen,
    handleLogoutSession,
    handleDisable2FA,
    apiFetch,
}) => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 md:p-8 shadow-sm transition-colors">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                    Sign-in Security
                </h3>

                <div className="space-y-6">
                    <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-slate-800">
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                                Email Verification
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Verified email is required for secure
                                transactions.
                            </p>
                        </div>
                        <span className="flex items-center gap-1 text-sm font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                ></path>
                            </svg>{" "}
                            Already verified
                        </span>
                    </div>

                    <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-slate-800">
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                                Extra Sign-in Security (2FA)
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Add an extra step to your login for more
                                security.
                            </p>
                        </div>
                        {profile.isTwoFactorEnabled ? (
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1 text-sm font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M5 13l4 4L19 7"
                                        ></path>
                                    </svg>{" "}
                                    Enabled
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDisable2FA}
                                    className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/30"
                                >
                                    Disable
                                </Button>
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsTwoFactorModalOpen(true)}
                            >
                                Enable Extra Security
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                                Account Password
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Change your password to keep your account
                                secure.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsPasswordModalOpen(true)}
                            className="dark:text-white dark:border-slate-700"
                        >
                            Change Password
                        </Button>
                    </div>
                </div>
            </div>

            <UpdatePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                customerId={profile.customerId}
                email={profile.email}
            />

            <TwoFactorModal
                isOpen={isTwoFactorModalOpen}
                onClose={() => setIsTwoFactorModalOpen(false)}
                onSuccess={() =>
                    setProfile({
                        ...profile,
                        isTwoFactorEnabled: true,
                    })
                }
                apiFetch={apiFetch}
            />

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 md:p-8 shadow-sm transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Recent Devices
                    </h3>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/30"
                        onClick={() => handleLogoutSession("all")}
                    >
                        Log out of all devices
                    </Button>
                </div>
                <div className="space-y-4">
                    {sessions.map((session: any) => {
                        const isOnline =
                            new Date().getTime() -
                                new Date(session.last_seen).getTime() <
                            60000;
                        return (
                            <div
                                key={session._id}
                                className={`flex flex-col sm:flex-row justify-between sm:items-center p-4 rounded-xl gap-4 ${isOnline ? "border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10" : "border border-gray-100 dark:border-slate-800"}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`w-10 h-10 ${isOnline ? "bg-white dark:bg-slate-800 shadow-sm" : "bg-gray-50 dark:bg-slate-800 shadow-sm"} rounded-full flex flex-shrink-0 items-center justify-center`}
                                    >
                                        <svg
                                            className="w-5 h-5 text-gray-600 dark:text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                            ></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">
                                            {session.userAgent ||
                                                "Unknown Device"}
                                            {isOnline && (
                                                <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 px-2 py-0.5 rounded-full uppercase">
                                                    Current
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            {session.location ||
                                                "Unknown Location"}{" "}
                                            •{" "}
                                            {isOnline
                                                ? "Active Now"
                                                : `Last seen: ${new Date(session.last_seen).toLocaleString()}`}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                                    onClick={() =>
                                        handleLogoutSession(session._id)
                                    }
                                >
                                    Log out
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
