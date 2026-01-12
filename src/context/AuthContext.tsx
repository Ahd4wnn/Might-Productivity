import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isGuest: boolean;
    signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
    signUp: (email: string, password: string) => Promise<{ data: any; error: any }>;
    signOut: () => Promise<{ error: any }>;
    resetPassword: (email: string) => Promise<{ data: any; error: any }>;
    continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(false);

    useEffect(() => {
        // Check for existing guest session
        const guestSession = localStorage.getItem('might_guest_session');
        if (guestSession === 'true') {
            setIsGuest(true);
            setLoading(false);
            return;
        }

        // Check active sessions
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                setIsGuest(false); // Clear guest mode if user logs in
                localStorage.removeItem('might_guest_session');
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const continueAsGuest = () => {
        setIsGuest(true);
        localStorage.setItem('might_guest_session', 'true');
    };

    const signOut = async () => {
        if (isGuest) {
            setIsGuest(false);
            localStorage.removeItem('might_guest_session');
            return { error: null };
        }
        return supabase.auth.signOut();
    };

    const value = {
        user,
        loading,
        isGuest,
        signUp: (email: string, password: string) => supabase.auth.signUp({ email, password }),
        signIn: (email: string, password: string) => supabase.auth.signInWithPassword({ email, password }),
        signOut,
        resetPassword: (email: string) => supabase.auth.resetPasswordForEmail(email),
        continueAsGuest
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
