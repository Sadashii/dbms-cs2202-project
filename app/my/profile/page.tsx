"use client";

import React from "react";
import { useProfile } from "@/hooks/useProfile";
import { GeneralTab } from "@/components/profile/GeneralTab";
import { SecurityTab } from "@/components/profile/SecurityTab";
import { PreferencesTab } from "@/components/profile/PreferencesTab";

export default function ProfilePage() {
    const {
        profile,
        setProfile,
        isLoading,
        authLoading,
        isSaving,
        isSubmittingDeletionRequest,
        activeTab,
        setActiveTab,
        sessions,
        isPasswordModalOpen,
        setIsPasswordModalOpen,
        isTwoFactorModalOpen,
        setIsTwoFactorModalOpen,
        formData,
        setFormData,
        notifs,
        setNotifs,
        handleSaveChanges,
        handleDeleteAccountRequest,
        handleLogoutSession,
        handleDisable2FA,
        apiFetch,
    } = useProfile();

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
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm text-center transition-colors">
                        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg mb-4 border-4 border-white dark:border-slate-800">
                            {profile.firstName.charAt(0)}
                            {profile.lastName.charAt(0)}
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {profile.firstName} {profile.lastName}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {profile.email}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-colors">
                        <button
                            onClick={() => setActiveTab("general")}
                            className={`px-6 py-4 text-sm font-semibold text-left transition-colors ${activeTab === "general" ? "bg-blue-50 dark:bg-slate-800 border-l-4 border-blue-600 text-blue-700 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 border-l-4 border-transparent"}`}
                        >
                            General Information
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

                {/* Content Area */}
                <div className="lg:col-span-3">
                    {activeTab === "general" && (
                        <GeneralTab
                            profile={profile}
                            formData={formData}
                            setFormData={setFormData}
                            isSaving={isSaving}
                            handleSaveChanges={handleSaveChanges}
                            isSubmittingDeletionRequest={
                                isSubmittingDeletionRequest
                            }
                            handleDeleteAccountRequest={
                                handleDeleteAccountRequest
                            }
                        />
                    )}

                    {activeTab === "security" && (
                        <SecurityTab
                            profile={profile}
                            setProfile={setProfile}
                            sessions={sessions}
                            isPasswordModalOpen={isPasswordModalOpen}
                            setIsPasswordModalOpen={setIsPasswordModalOpen}
                            isTwoFactorModalOpen={isTwoFactorModalOpen}
                            setIsTwoFactorModalOpen={setIsTwoFactorModalOpen}
                            handleLogoutSession={handleLogoutSession}
                            handleDisable2FA={handleDisable2FA}
                            apiFetch={apiFetch}
                        />
                    )}

                    {activeTab === "preferences" && (
                        <PreferencesTab notifs={notifs} setNotifs={setNotifs} />
                    )}
                </div>
            </div>
        </div>
    );
}
