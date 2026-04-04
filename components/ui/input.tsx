"use client";

import React, { InputHTMLAttributes, forwardRef, useId } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, helperText, id, disabled, ...props }, ref) => {
    // Auto-generate an ID for accessibility if one isn't provided
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={`block w-full rounded-md shadow-sm sm:text-sm transition-colors
              ${
                error
                  ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              }
              ${disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-white"}
              border px-3 py-2 outline-none
            `}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-description` : undefined}
            {...props}
          />
          
          {/* Error Icon Indicator inside input */}
          {error && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        {/* Dynamic Helper/Error Text */}
        {error ? (
          <p className="mt-1.5 text-sm text-red-600" id={`${inputId}-error`}>
            {error}
          </p>
        ) : helperText ? (
          <p className="mt-1.5 text-sm text-gray-500" id={`${inputId}-description`}>
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";