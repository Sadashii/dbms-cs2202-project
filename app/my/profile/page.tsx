"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { UpdatePasswordModal } from "@/components/UpdatePasswordModal";
import { TwoFactorModal } from "@/components/TwoFactorModal";

interface Address {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    isPrimary: boolean;
}

interface UserProfile {
    _id: string;
    firstName: string;
    lastName: string;
    customerId: string;
    email: string;
    isEmailVerified: boolean;
    isTwoFactorEnabled: boolean;
    phone?: string;
    role: string;
    createdAt: string;
    addresses: Address[];
}

export default function ProfilePage() {
    const { user, apiFetch, isLoading: authLoading } = useAuthContext();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmittingDeletionRequest, setIsSubmittingDeletionRequest] =
        useState(false);
    const [activeTab, setActiveTab] = useState<
        "general" | "security" | "preferences"
    >("general");
    const [sessions, setSessions] = useState<any[]>([]);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isTwoFactorModalOpen, setIsTwoFactorModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "India",
    });

    const [notifs, setNotifs] = useState({
        emailAlerts: true,
        smsAlerts: true,
        promotions: false,
    });
    const [twoFactor, setTwoFactor] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            try {
                setIsLoading(true);
                const res = await apiFetch("/api/users/me");
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data.user);
                    setSessions(data.sessions || []);
                    const primaryAddress =
                        data.user.addresses?.find(
                            (a: Address) => a.isPrimary,
                        ) ||
                        data.user.addresses?.[0] ||
                        {};
                    setFormData({
                        firstName: data.user.firstName || "",
                        lastName: data.user.lastName || "",
                        phone: data.user.phone || "",
                        street: primaryAddress.street || "",
                        city: primaryAddress.city || "",
                        state: primaryAddress.state || "",
                        zipCode: primaryAddress.zipCode || "",
                        country: primaryAddress.country || "India",
                    });
                }
            } catch (error) {
                toast.error("Failed to load profile data.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [user, apiFetch]);

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await apiFetch("/api/users/me", {
                method: "PATCH",
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                    address: {
                        street: formData.street,
                        city: formData.city,
                        state: formData.state,
                        zipCode: formData.zipCode,
                        country: formData.country,
                        isPrimary: true,
                    },
                }),
            });
            if (res.ok) {
                toast.success("Profile updated successfully!");
                const data = await res.json();
                setProfile(data.user);
            } else {
                toast.error("Failed to update profile.");
            }
        } catch (error) {
            toast.error("A network error occurred.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccountRequest = async () => {
        setIsSubmittingDeletionRequest(true);
        try {
            const res = await apiFetch("/api/users/me/delete-request", {
                method: "POST",
            });

            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || "Could not create deletion request.");
                return;
            }

            toast.success(data.message || "Deletion request submitted.");
        } catch (error) {
            toast.error("A network error occurred.");
        } finally {
            setIsSubmittingDeletionRequest(false);
        }
    };

    const handleLogoutSession = async (sessionId: string) => {
        try {
            const res = await apiFetch(`/api/users/me/sessions?id=${sessionId}`, { method: "DELETE" });
            if (res.ok) {
                toast.success(sessionId === "all" ? "Logged out of all devices" : "Session logged out");
                setSessions((prev) => sessionId === "all" ? [] : prev.filter((s: any) => s._id !== sessionId));
            } else {
                toast.error("Failed to log out session");
            }
        } catch (error) {
            toast.error("Network error");
        }
    };

    if (authLoading || isLoading)
        return (
            <div className="py-20 flex justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
        );
    if (!profile) return null;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in transition-colors pb-12">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">
                    Profile Settings
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                    Manage your identity, security, and account preferences.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm text-center transition-colors">
                        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg mb-4 border-4 border-white dark:border-slate-800">
                            {profile.firstName.charAt(0)}
                            {profile.lastName.charAt(0)}
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {profile.firstName} {profile.lastName}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">
                            {profile.email}
                        </p>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                            Customer ID
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-mono mt-1">
                            {profile.customerId}
                        </p>
                        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-800 flex flex-col gap-2">
                            <span className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30">
                                {profile.role}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-colors">
                        <button
                            onClick={() => setActiveTab("general")}
                            className={`px-6 py-4 text-sm font-semibold text-left transition-colors ${activeTab === "general" ? "bg-blue-50 dark:bg-slate-800 border-l-4 border-blue-600 text-blue-700 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 border-l-4 border-transparent"}`}
                        >
                            General Info
                        </button>
                        <button
                            onClick={() => setActiveTab("security")}
                            className={`px-6 py-4 text-sm font-semibold text-left border-t border-gray-100 dark:border-slate-800 transition-colors ${activeTab === "security" ? "bg-blue-50 dark:bg-slate-800 border-l-4 border-blue-600 text-blue-700 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 border-l-4 border-transparent"}`}
                        >
                            Security & Devices
                        </button>
                        <button
                            onClick={() => setActiveTab("preferences")}
                            className={`px-6 py-4 text-sm font-semibold text-left border-t border-gray-100 dark:border-slate-800 transition-colors ${activeTab === "preferences" ? "bg-blue-50 dark:bg-slate-800 border-l-4 border-blue-600 text-blue-700 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 border-l-4 border-transparent"}`}
                        >
                            Preferences
                        </button>
                    </div>
                </div>

                {}
                <div className="lg:col-span-3">
                    {}
                    {activeTab === "general" && (
                        <form
                            onSubmit={handleSaveChanges}
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors animate-fade-in"
                        >
                            <div className="p-6 md:p-8 space-y-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-2">
                                    Personal Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input
                                        label="First Name"
                                        value={formData.firstName}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                firstName: e.target.value,
                                            })
                                        }
                                        required
                                        disabled={isSaving}
                                    />
                                    <Input
                                        label="Last Name"
                                        value={formData.lastName}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                lastName: e.target.value,
                                            })
                                        }
                                        required
                                        disabled={isSaving}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                                            Customer ID
                                        </label>
                                        <input
                                            type="text"
                                            value={profile.customerId}
                                            disabled
                                            className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-2.5 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 cursor-not-allowed transition-colors font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={profile.email}
                                            disabled
                                            className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-2.5 
               bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 
               cursor-not-allowed transition-colors"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            Email cannot be changed directly.
                                        </p>
                                    </div>
                                    <Input
                                        label="Phone Number"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                phone: e.target.value.replace(
                                                    /\D/g,
                                                    "",
                                                ),
                                            })
                                        }
                                        placeholder="e.g. 9876543210"
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>

                            <div className="p-6 md:p-8 bg-gray-50 dark:bg-slate-800/30 border-t border-gray-100 dark:border-slate-800 space-y-6 transition-colors">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-2">
                                    Registered Address
                                </h3>
                                <div className="space-y-6">
                                    <Input
                                        label="Street Address"
                                        value={formData.street}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                street: e.target.value,
                                            })
                                        }
                                        placeholder="123 Main St, Apt 4B"
                                        disabled={isSaving}
                                    />
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="col-span-2 md:col-span-2">
                                            <Input
                                                label="City"
                                                value={formData.city}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        city: e.target.value,
                                                    })
                                                }
                                                disabled={isSaving}
                                            />
                                        </div>
                                        <div className="col-span-1 md:col-span-1">
                                            <Input
                                                label="State"
                                                value={formData.state}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        state: e.target.value,
                                                    })
                                                }
                                                disabled={isSaving}
                                            />
                                        </div>
                                        <div className="col-span-1 md:col-span-1">
                                            <Input
                                                label="ZIP Code"
                                                value={formData.zipCode}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        zipCode: e.target.value,
                                                    })
                                                }
                                                disabled={isSaving}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                                            Country
                                        </label>
                                        <select
                                            value={formData.country}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    country: e.target.value,
                                                })
                                            }
                                            disabled={isSaving}
                                            className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                        >
                                            <option value="India">India</option>
                                            <option value="United States">
                                                United States
                                            </option>
                                            <option value="United Kingdom">
                                                United Kingdom
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-5 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-4 transition-colors">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    isLoading={isSaving}
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    )}

                    {}
                    {activeTab === "security" && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 md:p-8 shadow-sm transition-colors">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                                    Authentication
                                </h3>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-slate-800">
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                Email Verification
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                Verified email is required for
                                                secure transactions.
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
                                                Two-Factor Authentication (2FA)
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                Add an extra layer of security
                                                to your account.
                                            </p>
                                        </div>
                                        {profile.isTwoFactorEnabled ? (
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
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setIsTwoFactorModalOpen(true)
                                                }
                                            >
                                                Enable 2FA
                                            </Button>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                Account Password
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                Change your password to keep
                                                your account secure.
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setIsPasswordModalOpen(true)
                                            }
                                            className="dark:text-white dark:border-slate-700"
                                        >
                                            Update Password
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
                                        new Date(
                                            session.last_seen,
                                        ).getTime() <
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
                                            onClick={() => handleLogoutSession(session._id)}
                                        >
                                            Log out
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                        </div>
                    )}

                    {}
                    {activeTab === "preferences" && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 md:p-8 shadow-sm transition-colors animate-fade-in">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                                Notification Settings
                            </h3>

                            <div className="space-y-4">
                                <label className="flex items-start gap-4 p-4 border border-gray-100 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={notifs.emailAlerts}
                                        onChange={(e) =>
                                            setNotifs({
                                                ...notifs,
                                                emailAlerts: e.target.checked,
                                            })
                                        }
                                        className="mt-1 w-4 h-4 text-blue-600 rounded bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                                    />
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            Email Transaction Alerts
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                            Receive emails for all debit and
                                            credit transactions.
                                        </p>
                                    </div>
                                </label>

                                <label className="flex items-start gap-4 p-4 border border-gray-100 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={notifs.smsAlerts}
                                        onChange={(e) =>
                                            setNotifs({
                                                ...notifs,
                                                smsAlerts: e.target.checked,
                                            })
                                        }
                                        className="mt-1 w-4 h-4 text-blue-600 rounded bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                                    />
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            Security SMS Alerts
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                            Get instant texts for logins from
                                            new devices or password changes.
                                        </p>
                                    </div>
                                </label>

                                <label className="flex items-start gap-4 p-4 border border-gray-100 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={notifs.promotions}
                                        onChange={(e) =>
                                            setNotifs({
                                                ...notifs,
                                                promotions: e.target.checked,
                                            })
                                        }
                                        className="mt-1 w-4 h-4 text-blue-600 rounded bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700"
                                    />
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            Marketing & Promotions
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                            Receive offers, credit card
                                            upgrades, and loan pre-approvals.
                                        </p>
                                    </div>
                                </label>
                            </div>

                            <div className="mt-10 pt-8 border-t border-gray-100 dark:border-slate-800">
                                <h3 className="text-lg font-bold text-red-600 dark:text-red-500 mb-2">
                                    Danger Zone
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    Permanently close your account and delete
                                    all associated data. This action cannot be
                                    undone.
                                </p>
                                <Button
                                    variant="outline"
                                    className="border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    isLoading={isSubmittingDeletionRequest}
                                    onClick={handleDeleteAccountRequest}
                                >
                                    Request Account Deletion
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
