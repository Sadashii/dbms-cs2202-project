import { useState, useEffect } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import toast from "react-hot-toast";

export interface Address {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    isPrimary: boolean;
}

export interface UserProfile {
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

export const useProfile = () => {
    const { user, apiFetch, isLoading: authLoading } = useAuthContext();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmittingDeletionRequest, setIsSubmittingDeletionRequest] = useState(false);
    const [activeTab, setActiveTab] = useState<"general" | "security" | "preferences">("general");
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
                        data.user.addresses?.find((a: Address) => a.isPrimary) ||
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

    const handleDisable2FA = async () => {
        try {
            const res = await apiFetch("/api/auth/2fa/disable", { method: "POST" });
            if (res.ok) {
                toast.success("Two-factor authentication disabled.");
                setProfile((prev) => prev ? { ...prev, isTwoFactorEnabled: false } : null);
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to disable 2FA.");
            }
        } catch (error) {
            toast.error("A network error occurred.");
        }
    };

    return {
        profile, setProfile,
        isLoading,
        authLoading,
        isSaving,
        isSubmittingDeletionRequest,
        activeTab, setActiveTab,
        sessions,
        isPasswordModalOpen, setIsPasswordModalOpen,
        isTwoFactorModalOpen, setIsTwoFactorModalOpen,
        formData, setFormData,
        notifs, setNotifs,
        handleSaveChanges,
        handleDeleteAccountRequest,
        handleLogoutSession,
        handleDisable2FA,
        apiFetch
    };
};
