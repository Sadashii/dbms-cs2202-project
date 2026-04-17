"use client";

import React, { useEffect } from "react";
import { Button } from "./button";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "md",
}: ModalProps) => {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  }[maxWidth];

  return (
    // Boosted z-index to ensure it always sits on top of everything
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-900/50 dark:bg-slate-950/80 transition-opacity backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div 
          className={`relative transform overflow-hidden rounded-lg bg-white dark:bg-slate-900 border border-transparent dark:border-slate-800 text-left shadow-xl dark:shadow-slate-900/50 transition-all sm:my-8 w-full ${maxWidthClass}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="bg-white dark:bg-slate-900 px-4 pb-4 pt-5 sm:p-6 sm:pb-4 border-b border-gray-200 dark:border-slate-800 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white transition-colors" id="modal-title">
                  {title}
                </h3>
                {description && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 transition-colors">{description}</p>
                )}
              </div>
              <button
                type="button"
                className="rounded-md bg-white dark:bg-transparent text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors"
                onClick={onClose}
              >
                <span className="sr-only">Close panel</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="bg-white dark:bg-slate-900 px-4 py-5 sm:p-6 transition-colors">
            {children}
          </div>

          {/* Footer (Optional) */}
          {footer ? (
            <div className="bg-gray-50 dark:bg-slate-800/50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-gray-200 dark:border-slate-800 transition-colors">
              {footer}
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-slate-800/50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-gray-200 dark:border-slate-800 transition-colors">
              <Button variant="ghost" onClick={onClose} className="mt-3 sm:mt-0 dark:text-gray-300 dark:hover:bg-slate-800">
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};