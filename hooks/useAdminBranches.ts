import { useState, useEffect } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import toast from "react-hot-toast";

export const useAdminBranches = () => {
    const { apiFetch, user } = useAuthContext();
    const [branches, setBranches] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUsersLoading, setIsUsersLoading] = useState(false);

    const [selectedBranchId, setSelectedBranchId] = useState<string>("");
    const [roleFilter, setRoleFilter] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    // Form states for Branch
    const [branchName, setBranchName] = useState("");
    const [branchCode, setBranchCode] = useState("");
    const [branchType, setBranchType] = useState("Main");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [street, setStreet] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [zipCode, setZipCode] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");

    // Form states for Assign/Role
    const [assignBranchId, setAssignBranchId] = useState("");
    const [assignRole, setAssignRole] = useState("");

    const fetchBranches = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch("/api/admin/branches");
            if (res.ok) {
                const data = await res.json();
                setBranches(data.branches || []);
            }
        } catch (err) {
            console.error("Failed to load branches", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUsers = async () => {
        setIsUsersLoading(true);
        try {
            const url = `/api/admin/users?role=${roleFilter}&branchId=${selectedBranchId}`;
            const res = await apiFetch(url);
            if (res.ok) {
                const data = await res.json();
                setUsers(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Failed to load users", err);
        } finally {
            setIsUsersLoading(false);
        }
    };

    useEffect(() => {
        if (user && ["Admin", "Manager", "Employee"].includes(user.role)) {
            fetchBranches();
        }
    }, [user, apiFetch]);

    useEffect(() => {
        if (user) fetchUsers();
    }, [user, roleFilter, selectedBranchId]);

    const handleAddBranch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await apiFetch("/api/admin/branches", {
                method: "POST",
                body: JSON.stringify({
                    branchName,
                    branchCode,
                    branchType,
                    contactInfo: { email, phone },
                    address: { street, city, state, zipCode },
                    latitude,
                    longitude,
                }),
            });

            if (res.ok) {
                toast.success("Branch network expanded.");
                setIsAddModalOpen(false);
                setBranchName("");
                setBranchCode("");
                setLatitude("");
                setLongitude("");
                fetchBranches();
            }
        } catch (err) {
            toast.error("Network error.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAssignUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        setIsSubmitting(true);
        try {
            const res = await apiFetch(
                `/api/admin/users/${selectedUser._id}/role`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        role: assignRole,
                        branchId: assignBranchId || null,
                    }),
                },
            );

            if (res.ok) {
                toast.success("User assignment updated.");
                setIsAssignModalOpen(false);
                fetchUsers();
            }
        } catch (err) {
            toast.error("Network error.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openAssignModal = (u: any) => {
        setSelectedUser(u);
        setAssignBranchId(u.branchId || "");
        setAssignRole(u.role);
        setIsAssignModalOpen(true);
    };

    const filteredUsers = users.filter(
        (u) =>
            `${u.firstName} ${u.lastName}`
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const totalGlobalLoanVolume = branches.reduce(
        (sum, b) => sum + (b.totalLoanVolume || 0),
        0,
    );
    const totalGlobalTxVolume = branches.reduce(
        (sum, b) => sum + (b.transactionVolume || 0),
        0,
    );

    return {
        user,
        branches,
        users,
        isLoading,
        isUsersLoading,
        selectedBranchId,
        setSelectedBranchId,
        roleFilter,
        setRoleFilter,
        searchQuery,
        setSearchQuery,
        isAddModalOpen,
        setIsAddModalOpen,
        isAssignModalOpen,
        setIsAssignModalOpen,
        isSubmitting,
        selectedUser,
        branchName,
        setBranchName,
        branchCode,
        setBranchCode,
        branchType,
        setBranchType,
        email,
        setEmail,
        phone,
        setPhone,
        street,
        setStreet,
        city,
        setCity,
        state,
        setState,
        zipCode,
        setZipCode,
        latitude,
        setLatitude,
        longitude,
        setLongitude,
        assignBranchId,
        setAssignBranchId,
        assignRole,
        setAssignRole,
        handleAddBranch,
        handleAssignUser,
        openAssignModal,
        filteredUsers,
        totalGlobalLoanVolume,
        totalGlobalTxVolume,
        fetchBranches,
        fetchUsers,
    };
};
