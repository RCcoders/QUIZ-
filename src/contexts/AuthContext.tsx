import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    updateProfile,
    type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import type { UserProfile } from '../types/student';

interface User {
    uid: string;
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
    signInWithGoogle: () => Promise<{ error: any }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toAppUser(fbUser: FirebaseUser, role = 'student'): User {
    return {
        uid: fbUser.uid,
        _id: fbUser.uid,
        email: fbUser.email ?? '',
        displayName: fbUser.displayName ?? fbUser.email ?? '',
        role,
        token: '',
    };
}

function buildUserProfile(fbUser: FirebaseUser, role: 'student' | 'teacher'): UserProfile {
    return {
        uid: fbUser.uid,
        email: fbUser.email ?? '',
        displayName: fbUser.displayName ?? fbUser.email ?? '',
        role,
        createdAt: new Date().toISOString(),
        streak: 0,
        lastActiveDate: new Date().toISOString().slice(0, 10),
    };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (fbUser) => {
            if (fbUser) {
                const stored = localStorage.getItem('userRole');
                const role = (stored === 'teacher' ? 'teacher' : 'student') as 'student' | 'teacher';
                setUser(toAppUser(fbUser, role));
                setUserProfile(buildUserProfile(fbUser, role));
            } else {
                setUser(null);
                setUserProfile(null);
            }
            setLoading(false);
        });
        return unsub;
    }, []);

    const signUp = async (email: string, password: string, displayName: string, role: string) => {
        try {
            const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(fbUser, { displayName });
            localStorage.setItem('userRole', role);
            setUser(toAppUser(fbUser, role));
            return { error: null };
        } catch (error: any) {
            return { error };
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            const { user: fbUser } = await signInWithEmailAndPassword(auth, email, password);
            const role = (localStorage.getItem('userRole') === 'teacher' ? 'teacher' : 'student') as 'student' | 'teacher';
            setUser(toAppUser(fbUser, role));
            setUserProfile(buildUserProfile(fbUser, role));
            return { error: null };
        } catch (error: any) {
            return { error };
        }
    };

    const signInWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const { user: fbUser } = await signInWithPopup(auth, provider);
            const role = (localStorage.getItem('userRole') === 'teacher' ? 'teacher' : 'student') as 'student' | 'teacher';
            setUser(toAppUser(fbUser, role));
            setUserProfile(buildUserProfile(fbUser, role));
            return { error: null };
        } catch (error: any) {
            return { error };
        }
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
        localStorage.removeItem('userRole');
        setUser(null);
        setUserProfile(null);
    };

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, signUp, signIn, signInWithGoogle, signOut }}>
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
