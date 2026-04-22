import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface GeneralTabProps {
    profile: any;
    formData: any;
    setFormData: (data: any) => void;
    isSaving: boolean;
    handleSaveChanges: (e: React.FormEvent) => void;
    isSubmittingDeletionRequest: boolean;
    handleDeleteAccountRequest: () => void;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({
    profile,
    formData,
    setFormData,
    isSaving,
    handleSaveChanges,
    isSubmittingDeletionRequest,
    handleDeleteAccountRequest,
}) => {
    return (
        <>
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
                                    phone: e.target.value.replace(/\D/g, ""),
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
                                    label="ZIP/Postal Code"
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
                    </div>
                </div>

                <div className="p-6 md:p-8 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 flex justify-end transition-colors">
                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full md:w-auto"
                        isLoading={isSaving}
                    >
                        Save Profile Changes
                    </Button>
                </div>
            </form>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/30 p-6 md:p-8 shadow-sm transition-colors mt-8">
                <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">
                    Danger Zone
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Deleting your account is permanent. This action will erase
                    all your data, close your accounts, and wipe your
                    transaction history.
                </p>
                <Button
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/30"
                    onClick={() => {
                        if (
                            confirm(
                                "Are you absolutely sure you want to request account deletion? This action cannot be undone.",
                            )
                        ) {
                            handleDeleteAccountRequest();
                        }
                    }}
                    isLoading={isSubmittingDeletionRequest}
                >
                    Request Account Deletion
                </Button>
            </div>
        </>
    );
};
