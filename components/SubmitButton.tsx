"use client";

import { useFormStatus } from "react-dom";

interface SubmitButtonProps {
  label: string;
  loadingLabel?: string;
  className?: string;
}

export function SubmitButton({ label, loadingLabel = "Loading…", className = "" }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full py-2 px-4 rounded-md font-semibold text-white transition-colors
        ${pending ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}
        ${className}`}
    >
      {pending ? loadingLabel : label}
    </button>
  );
}
