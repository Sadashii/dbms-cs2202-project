"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";

// TODO: In the future, install a toast library like 'sonner' or 'react-hot-toast'
// import { toast } from "sonner";

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
    email: string;
    role: string;
    currentStatus: string;
    // Add other relevant fields from your User schema
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
            
            // RELATIVE PATH: Works on both localhost and production domains
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
    const apiFetch = async (url: string, options: RequestInit = {}) => {
        const headers: HeadersInit = {
            ...options.headers,
            'Content-Type': 'application/json',
        };

        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
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
                    
                    headers['Authorization'] = `Bearer ${data.access_token}`;
                    // Retry the original request
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
    };

    // --- Auth Methods ---
    const signup = async (name: string, email: string, password: string) => {
        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();
            if (!response.ok) {
                alert(data.message); // TODO: Replace with toast.error(data.message)
                return;
            }

            alert(data.message); // TODO: Replace with toast.success(data.message)
            router.push("/auth/login/");
        } catch (error) {
            console.error("Network Error:", error);
        }
    };

    const getLoginOTP = async (email: string, password: string): Promise<boolean> => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ process: "generateotp", email, password })
            });

            const data = await response.json();
            if (!response.ok) {
                alert(data.message); // TODO: Replace with toast.error(data.message)
                return false;
            }

            alert(data.message); // TODO: Replace with toast.success(data.message) 
            return true;
        } catch (error) {
            console.error("Network Error:", error);
            return false;
        }
    };

    const verifyLogin = async (email: string, password: string, otp: string) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ process: "verifyotp", email, password, otp })
            });

            const data = await response.json();
            if (!response.ok) {
                alert(data.message); // TODO: Replace with toast.error(data.message)
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

    // --- Form Validation (Refactored to be a Pure Function) ---
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

    // --- Protected Route Wrapper (Refactored to avoid Render-Phase Redirects) ---
    const requireAuth = (redirect: string = '/auth/login') => {
        useEffect(() => {
            if (!isLoading && !isLoggedIn) {
                router.push(redirect);
            }
        }, [isLoading, isLoggedIn, redirect, router]);

        return isLoggedIn;
    };

    return {
        isLoading,
        isLoggedIn,
        user,
        accessToken,
        signup,
        getLoginOTP,
        verifyLogin,
        logout,
        verifyConstraints,
        apiFetch,
        requireAuth
    };
};