import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { UserProfile } from '../types/student';

interface User {
    _id: string;
    email: string;
    displayName: string;
    role: 'student' | 'teacher';
    token: string;
}

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    signUp: (email: string, password: string, displayName: string, role: string) => Promise<{ error: any }>;
    signIn: (email: string, password: string, role?: string) => Promise<{ error: any }>;
    signInWithGoogle: () => Promise<{ error: any }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = '/api/auth';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Initial load: Check if token exists
    useEffect(() => {
        const syncAuth = () => {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                    setUserProfile({
                        uid: parsedUser._id,
                        email: parsedUser.email,
                        displayName: parsedUser.displayName,
                        role: parsedUser.role,
                        streak: 0,
                        lastActiveDate: new Date().toISOString().slice(0, 10),
                        createdAt: new Date().toISOString()
                    });
                } catch (e) {
                    localStorage.removeItem('user');
                    setUser(null);
                    setUserProfile(null);
                }
            } else {
                setUser(null);
                setUserProfile(null);
            }
            setLoading(false);
        };

        syncAuth();

        // Listen for changes from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'user') {
                syncAuth();
            }
        });

        return () => window.removeEventListener('storage', syncAuth);
    }, []);

    const signUp = async (email: string, password: string, displayName: string, role: string) => {
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, displayName, role }),
            });

            const data = await response.json().catch(() => ({ message: 'Invalid server response' }));
            if (!response.ok) throw new Error(data.message || 'Signup failed');

            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            setUserProfile({
                uid: data._id,
                email: data.email,
                displayName: data.displayName,
                role: data.role,
                streak: 0,
                lastActiveDate: new Date().toISOString().slice(0, 10),
                createdAt: new Date().toISOString()
            });

            return { error: null };
        } catch (error: any) {
            console.error('Signup error:', error);
            return { error };
        }
    };

    const signIn = async (email: string, password: string, role?: string) => {
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role }),
            });

            const data = await response.json().catch(() => ({ message: 'Invalid server response' }));
            if (!response.ok) throw new Error(data.message || 'Login failed');

            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            setUserProfile({
                uid: data._id,
                email: data.email,
                displayName: data.displayName,
                role: data.role,
                streak: 0,
                lastActiveDate: new Date().toISOString().slice(0, 10),
                createdAt: new Date().toISOString()
            });

            return { error: null };
        } catch (error: any) {
            console.error('Signin error:', error);
            return { error };
        }
    };

    const signOut = async () => {
        localStorage.removeItem('user');
        setUser(null);
        setUserProfile(null);
    };

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, signUp, signIn, signOut, signInWithGoogle: async () => ({ error: 'Not implemented' }) }}>
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
