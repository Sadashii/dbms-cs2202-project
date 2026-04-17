"use client";

import React, { useState } from "react";
import { Modal } from "./ui/modal";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import toast from "react-hot-toast";
import { useAuthContext } from "./AuthProvider";

interface ReuploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentType: string;
    onSuccess: () => void;
}

export const ReuploadModal: React.FC<ReuploadModalProps> = ({ isOpen, onClose, documentType, onSuccess }) => {
    const { apiFetch } = useAuthContext();
    const [file, setFile] = useState<File | null>(null);
    const [idNumber, setIdNumber] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast.error("Please select a file to upload.");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("kycType", documentType);
            
            if (documentType === 'PAN') {
                formData.append("panCard", file);
                if (idNumber) formData.append("panNumber", idNumber);
            } else if (documentType === 'Aadhar') {
                formData.append("aadhar", file);
                if (idNumber) formData.append("aadharNumber", idNumber);
            } else if (documentType === 'Signature') {
                formData.append("signature", file);
            }

            const res = await apiFetch("/api/account-requests", {
                method: "PATCH",
                body: formData
            });

            if (res.ok) {
                toast.success(`${documentType} re-submitted successfully.`);
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                toast.error(data.message || "Failed to re-submit document.");
            }
        } catch (err) {
            toast.error("A network error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => !isSubmitting && onClose()}
            title={`Re-upload ${documentType}`}
            description={`Please provide a clear image of your ${documentType} to replace the rejected one.`}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {documentType !== 'Signature' && (
                    <Input
                        label={`${documentType} Number (Optional if correct)`}
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value.toUpperCase())}
                        placeholder={`Enter your ${documentType} number`}
                        disabled={isSubmitting}
                    />
                )}
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{documentType} Image</label>
                    <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        required
                        disabled={isSubmitting}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 focus:outline-none"
                    />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 mt-6">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" isLoading={isSubmitting}>
                        Submit for Review
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
