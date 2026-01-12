import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading, isGuest } = useAuth();

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50">
                <div className="animate-pulse text-gray-400 text-sm font-medium">Loading...</div>
            </div>
        );
    }

    if (!user && !isGuest) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}
