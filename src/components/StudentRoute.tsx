import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface StudentRouteProps {
    children: ReactNode;
}

export function StudentRoute({ children }: StudentRouteProps) {
    const { user, userProfile, loading } = useAuth();

    if (loading) return null;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (userProfile?.role === 'teacher') {
        return <Navigate to="/teacher" replace />;
    }

    return <>{children}</>;
}
