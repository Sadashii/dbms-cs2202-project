import { useState, useEffect } from "react";

/**
 * A custom hook that delays updating a value until after a specified delay has passed 
 * since the last time the value was changed.
 * * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
    // State and setters for debounced value
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Update debounced value after the specified delay
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Cancel the timeout if value changes (also on delay change or unmount)
        // This is how we prevent the debounced value from updating if the value is changed 
        // within the delay period. The timeout gets cleared and restarted.
        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]); // Only re-call effect if value or delay changes

    return debouncedValue;
}

export default useDebounce;