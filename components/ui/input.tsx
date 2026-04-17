import React, { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
            {label}
          </label>
        )}
        <input
          ref={ref}
          // Notice the "!" before the dark classes - this forces them to apply
          className={`w-full border rounded-lg px-4 py-2.5 outline-none transition-colors 
  bg-white text-gray-900 border-gray-200 
  dark:!bg-slate-900 dark:!text-white dark:!border-slate-800
  ${error ? "border-red-500" : ""} ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
