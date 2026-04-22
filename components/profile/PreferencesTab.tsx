import React from "react";

interface PreferencesTabProps {
    notifs: {
        emailAlerts: boolean;
        smsAlerts: boolean;
        promotions: boolean;
    };
    setNotifs: (notifs: any) => void;
}

export const PreferencesTab: React.FC<PreferencesTabProps> = ({ notifs, setNotifs }) => {
    return (
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
                            Receive emails for all debit and credit transactions.
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
                            Get instant texts for logins from new devices or password changes.
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
                            Receive offers, credit card upgrades, and loan pre-approvals.
                        </p>
                    </div>
                </label>
            </div>
        </div>
    );
};
