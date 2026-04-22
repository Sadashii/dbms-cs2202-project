import { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export interface Beneficiary {
    _id: string;
    nickName: string;
    accountNumber: string;
    accountName: string;
    createdAt: string;
}

export const useBeneficiaries = () => {
    const { apiFetch, isLoading: authLoading, isLoggedIn } = useAuthContext();
    const router = useRouter();

    const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [addForm, setAddForm] = useState({
        nickName: "",
        accountNumber: "",
        accountName: "",
    });
    const [isSaving, setIsSaving] = useState(false);

    const [renameId, setRenameId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [isRenaming, setIsRenaming] = useState(false);

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchBeneficiaries = useCallback(async () => {
        try {
            const res = await apiFetch("/api/beneficiaries");
            if (res.ok) {
                const data = await res.json();
                setBeneficiaries(data.beneficiaries);
            }
        } catch {
            toast.error("Could not load beneficiaries.");
        } finally {
            setIsLoading(false);
        }
    }, [apiFetch]);

    useEffect(() => {
        if (!authLoading && !isLoggedIn) router.push("/auth/login");
    }, [authLoading, isLoggedIn, router]);

    useEffect(() => {
        if (!authLoading && isLoggedIn) fetchBeneficiaries();
    }, [authLoading, isLoggedIn, fetchBeneficiaries]);

    const filtered = beneficiaries.filter(
        (b) =>
            b.nickName.toLowerCase().includes(search.toLowerCase()) ||
            b.accountName.toLowerCase().includes(search.toLowerCase()) ||
            b.accountNumber.includes(search),
    );

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const tid = toast.loading("Saving recipient...");
        try {
            const res = await apiFetch("/api/beneficiaries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(addForm),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.message || "Failed to add recipient.", { id: tid });
                return;
            }
            toast.success("Recipient saved!", { id: tid });
            setIsAddOpen(false);
            setAddForm({ nickName: "", accountNumber: "", accountName: "" });
            await fetchBeneficiaries();
        } catch {
            toast.error("Something went wrong.", { id: tid });
        } finally {
            setIsSaving(false);
        }
    };

    const handleRename = async (id: string) => {
        if (!renameValue.trim()) return;
        setIsRenaming(true);
        const tid = toast.loading("Updating nickname...");
        try {
            const res = await apiFetch(`/api/beneficiaries?id=${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nickName: renameValue.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.message || "Update failed.", { id: tid });
                return;
            }
            toast.success("Nickname updated.", { id: tid });
            setRenameId(null);
            setBeneficiaries((prev) =>
                prev.map((b) => (b._id === id ? { ...b, nickName: renameValue.trim() } : b)),
            );
        } catch {
            toast.error("Something went wrong.", { id: tid });
        } finally {
            setIsRenaming(false);
        }
    };

    const handleDelete = async (id: string) => {
        setIsDeleting(true);
        const tid = toast.loading("Removing recipient...");
        try {
            const res = await apiFetch(`/api/beneficiaries?id=${id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.message || "Delete failed.", { id: tid });
                return;
            }
            toast.success("Recipient removed.", { id: tid });
            setDeleteId(null);
            setBeneficiaries((prev) => prev.filter((b) => b._id !== id));
        } catch {
            toast.error("Something went wrong.", { id: tid });
        } finally {
            setIsDeleting(false);
        }
    };

    return {
        beneficiaries,
        isLoading,
        authLoading,
        search, setSearch,
        isAddOpen, setIsAddOpen,
        addForm, setAddForm,
        isSaving,
        renameId, setRenameId,
        renameValue, setRenameValue,
        isRenaming,
        deleteId, setDeleteId,
        isDeleting,
        filtered,
        handleAdd,
        handleRename,
        handleDelete
    };
};
