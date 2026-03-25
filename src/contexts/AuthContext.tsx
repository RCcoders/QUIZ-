import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authApi } from '../api';
import type { UserProfile } from '../types/student';

interface User {
    _id: string;
    email: string;
    displayName: string;
    role: string;
    token: string;
}

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    signUp: (email: string, password: string, displayName: string, role: string) => Promise<{ error: any }>;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            setUser(JSON.parse(userInfo));
        }
        setLoading(false);
    }, []);

    const signUp = async (email: string, password: string, displayName: string, role: string) => {
        try {
            const { data } = await authApi.register({ email, password, displayName, role });
            localStorage.setItem('userInfo', JSON.stringify(data));
            setUser(data);
            return { error: null };
        } catch (error: any) {
            return { error: error.response?.data?.message || error.message };
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            const { data } = await authApi.login({ email, password });
            localStorage.setItem('userInfo', JSON.stringify(data));
            setUser(data);
            return { error: null };
        } catch (error: any) {
            return { error: error.response?.data?.message || error.message };
        }
    };

    const signOut = async () => {
        localStorage.removeItem('userInfo');
        setUser(null);
        setUserProfile(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                userProfile,
                loading,
                signUp,
                signIn,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
