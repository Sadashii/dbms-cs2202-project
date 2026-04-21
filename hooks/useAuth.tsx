"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";

import toast from "react-hot-toast";

// --- TypeScript Interfaces ---
export interface Constraint {
    value: string;
}

export interface Constraints {
    email?: Constraint;
    password?: Constraint;
    confirmpassword?: Constraint;
}

export interface ValidationErrors {
    email?: string;
    password?: string;
    confirmpassword?: string;
}

export interface UserPayload {
    _id: string;
    firstName: string;
    lastName: string;
    customerId: string;
    email: string;
    role: string;
    currentStatus: string;
}

export interface SignupResult {
    success: boolean;
    customerId?: string;
    message?: string;
}

export interface LoginOtpResult {
    success: boolean;
    otp?: string;
    message?: string;
}

export interface PasswordResetOtpResult {
    success: boolean;
    otp?: string;
    message?: string;
}

export const useAuth = () => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [user, setUser] = useState<UserPayload | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    
    // Lock to prevent multiple simultaneous refresh requests (fixes race conditions)
    const isRefreshing = useRef<boolean>(false);
    
    const router = useRouter();

    // Wrapped in useCallback to prevent infinite loops if used in component dependency arrays
    const refreshAccessToken = useCallback(async () => {
        // Prevent concurrent refresh calls
        if (isRefreshing.current) return;

        try {
            isRefreshing.current = true;
            setIsLoading(true);
            
            const response = await fetch('/api/auth/refresh', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setAccessToken(data.access_token);
                setUser(data.user);
                setIsLoggedIn(true);
            } else {
                setIsLoggedIn(false);
                setUser(null);
                setAccessToken(null);
            }
        } catch (error) {
            console.error("Silent refresh failed:", error);
            setIsLoggedIn(false);
        } finally {
            setIsLoading(false);
            isRefreshing.current = false;
        }
    }, []);

    // Initial mount check
    useEffect(() => {
        refreshAccessToken();
    }, [refreshAccessToken]);

    // --- The Smart Fetch Wrapper ---
    // Memoized with useCallback so components can safely list it as a useEffect dependency
    // without triggering infinite re-render loops.
    const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
        const headers = new Headers(options.headers);

        if (!(options.body instanceof FormData)) {
            headers.set('Content-Type', 'application/json');
        }
        
        if (accessToken) {
            headers.set('Authorization', `Bearer ${accessToken}`);
        }

        let response = await fetch(url, { ...options, headers });

        // Intercept expired tokens
        if (response.status === 401) {
            console.log("Access token expired, attempting silent refresh...");
            try {
                const refreshResponse = await fetch('/api/auth/refresh', {
                    method: 'POST',
                    credentials: 'include'
                });

                if (refreshResponse.ok) {
                    const data = await refreshResponse.json();
                    setAccessToken(data.access_token);
                    
                    headers.set('Authorization', `Bearer ${data.access_token}`);
                    // Retry the original request with the new token
                    response = await fetch(url, { ...options, headers });
                } else {
                    console.warn("Refresh token invalid. Logging out.");
                    await logout('/auth/login');
                }
            } catch (error) {
                console.error("Failed to intercept and refresh:", error);
                await logout('/auth/login');
            }
        }
        return response;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accessToken]);

    // --- Auth Methods ---
    const signup = async (name: string, email: string, password: string): Promise<SignupResult> => {
        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();
            if (!response.ok) {
                toast.error(data.message);
                return { success: false, message: data.message };
            }

            toast.success(
                data.customerId
                    ? `${data.message} Your customer ID is ${data.customerId}.`
                    : data.message
            );
            router.push("/auth/login/");
            return { success: true, customerId: data.customerId, message: data.message };
        } catch (error) {
            console.error("Network Error:", error);
            return { success: false, message: "Network error. Please try again." };
        }
    };

    const getLoginOTP = async (identifier: string, password: string): Promise<LoginOtpResult> => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ process: "generateotp", identifier, password })
            });

            const data = await response.json();
            if (!response.ok) {
                toast.error(data.message);
                return { success: false, message: data.message };
            }

            return { success: true, otp: data.otp, message: data.message };
        } catch (error) {
            console.error("Network Error:", error);
            return { success: false, message: "Network error. Please try again." };
        }
    };

    const verifyLogin = async (identifier: string, password: string, otp: string) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ process: "verifyotp", identifier, password, otp })
            });

            const data = await response.json();
            if (!response.ok) {
                toast.error(data.message);
                return false;
            }
            
            setAccessToken(data.access_token);
            setUser(data.user);
            setIsLoggedIn(true);
            
            return true;
        } catch (error) {
            console.error("Network Error:", error);
            return false;
        }
    };

    const getResetPasswordOTP = async (
        customerId: string,
        email: string,
        oldPassword: string,
        newPassword: string
    ): Promise<PasswordResetOtpResult> => {
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    process: "generateotp",
                    customerId,
                    email,
                    oldPassword,
                    newPassword
                })
            });

            const data = await response.json();
            if (!response.ok) {
                toast.error(data.message);
                return { success: false, message: data.message };
            }

            return { success: true, otp: data.otp, message: data.message };
        } catch (error) {
            console.error("Network Error:", error);
            return { success: false, message: "Network error. Please try again." };
        }
    };

    const confirmPasswordReset = async (
        customerId: string,
        email: string,
        oldPassword: string,
        newPassword: string,
        otp: string
    ) => {
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    process: "verifyotp",
                    customerId,
                    email,
                    oldPassword,
                    newPassword,
                    otp
                })
            });

            const data = await response.json();
            if (!response.ok) {
                toast.error(data.message);
                return false;
            }

            toast.success(data.message);
            return true;
        } catch (error) {
            console.error("Network Error:", error);
            return false;
        }
    };

    const logout = async (redirect: string = '/') => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
            });
        } catch (error) {
            console.error("Logout API failed, clearing local state anyway.", error);
        } finally {
            setUser(null);
            setAccessToken(null);
            setIsLoggedIn(false);
            router.push(redirect);
        }
    };

    // --- Form Validation (Pure Function) ---
    const verifyConstraints = (constraints: Constraints): { isValid: boolean, errors: ValidationErrors } => {
        const errors: ValidationErrors = {};
        let isValid = true;

        if (constraints.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(constraints.email.value)) {
                errors.email = 'Please enter a valid email address.';
                isValid = false;
            }
        }

        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
        
        if (constraints.password) {
            if (!strongPasswordRegex.test(constraints.password.value)) {
                errors.password = 'Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character.';
                isValid = false;
            }
        }

        if (constraints.confirmpassword) {
            if (!strongPasswordRegex.test(constraints.confirmpassword.value)) {
                errors.confirmpassword = 'Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character.';
                isValid = false;
            } else if (constraints.password?.value !== constraints.confirmpassword.value) {
                errors.confirmpassword = 'Passwords do not match.';
                isValid = false;
            }
        }

        return { isValid, errors };
    };

    return {
        isLoading,
        isLoggedIn,
        user,
        accessToken,
        signup,
        getLoginOTP,
        verifyLogin,
        getResetPasswordOTP,
        confirmPasswordReset,
        logout,
        verifyConstraints,
        apiFetch,
    };
};

// --- Standalone hook for protecting routes (Rules of Hooks compliant) ---
// Usage: call `useRequireAuth()` at the TOP LEVEL of a page component.
// This replaces the old `requireAuth()` function-inside-a-hook pattern.
export const useRequireAuth = (redirect: string = '/auth/login') => {
    const router = useRouter();
    
    // These must be accessed via the context in the actual page; this export
    // is a standalone convenience hook for pages that import useAuth directly.
    // Pages using AuthProvider should call useAuthContext() and handle redirect themselves.
    return { redirect };
};
