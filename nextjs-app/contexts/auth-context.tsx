'use client';

import React, { useContext, useState, useEffect } from 'react';
import { auth, googleProvider, githubProvider } from '../lib/firebase';
import {
    signInWithPopup,
    signInAnonymously,
    signOut,
    onAuthStateChanged,
    User
} from 'firebase/auth';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    error: string;
    clearError: () => void;
    signInWithGoogle: () => Promise<any>;
    signInWithGitHub: () => Promise<any>;
    logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    function clearError() {
        setError('');
    }

    async function signInWithGoogle() {
        try {
            setError('');
            const result = await signInWithPopup(auth, googleProvider);
            return result;
        } catch (error: any) {
            console.error('Google sign in error:', error);
            setError(getErrorMessage(error.code));
            throw error;
        }
    }

    async function signInWithGitHub() {
        try {
            setError('');
            const result = await signInWithPopup(auth, githubProvider);
            return result;
        } catch (error: any) {
            console.error('GitHub sign in error:', error);
            setError(getErrorMessage(error.code));
            throw error;
        }
    }

    async function logout() {
        try {
            setError('');
            await signOut(auth);
            // After sign out, create a new anonymous user
            await signInAnonymously(auth);
        } catch (error: any) {
            setError(getErrorMessage(error.code));
            throw error;
        }
    }

    function getErrorMessage(errorCode: string) {
        switch (errorCode) {
            case 'auth/user-not-found':
                return 'No account found with this email address.';
            case 'auth/wrong-password':
                return 'Incorrect password. Please try again.';
            case 'auth/email-already-in-use':
                return 'An account with this email already exists.';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters long.';
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/user-disabled':
                return 'This account has been disabled.';
            case 'auth/popup-closed-by-user':
                return 'Sign-in was cancelled. Please try again.';
            case 'auth/cancelled-popup-request':
                return 'Sign-in was cancelled due to another popup request.';
            case 'auth/popup-blocked':
                return 'Pop-up was blocked. Please allow pop-ups for this site and try again.';
            case 'auth/invalid-credential':
                return 'Invalid email or password. Please check your credentials.';
            case 'auth/network-request-failed':
                return 'Network error. Please check your connection and try again.';
            case 'auth/too-many-requests':
                return 'Too many failed attempts. Please try again later.';
            case 'auth/operation-not-allowed':
                return 'This sign-in method is not enabled. Please contact support.';
            case 'auth/account-exists-with-different-credential':
                return 'An account already exists with this email using a different sign-in method.';
            case 'auth/timeout':
                return 'The operation timed out. Please try again.';
            default:
                return 'An error occurred during authentication. Please try again.';
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                // No user logged in - create anonymous user automatically
                try {
                    await signInAnonymously(auth);
                    // onAuthStateChanged will be called again with the new anonymous user
                } catch (error) {
                    console.error('Failed to create anonymous user:', error);
                    setCurrentUser(null);
                    setLoading(false);
                }
            } else {
                setCurrentUser(user);
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const value: AuthContextType = {
        currentUser,
        loading,
        error,
        clearError,
        signInWithGoogle,
        signInWithGitHub,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}