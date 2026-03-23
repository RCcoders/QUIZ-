import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
    type User,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { UserProfile } from '../types/student';

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    signUp: (email: string, password: string, displayName: string, role: 'student' | 'teacher') => Promise<{ error: Error | null }>;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signInWithGoogle: () => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function createUserProfile(uid: string, data: Omit<UserProfile, 'uid'>): Promise<void> {
    await setDoc(doc(db, 'users', uid), { uid, ...data });
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                try {
                    const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
                    setUserProfile(snap.exists() ? (snap.data() as UserProfile) : null);
                } catch {
                    console.warn('Failed to fetch user profile, defaulting to null');
                    setUserProfile(null);
                }
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signUp = async (email: string, password: string, displayName: string, role: 'student' | 'teacher') => {
        try {
            const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
            await createUserProfile(newUser.uid, {
                email,
                displayName,
                role,
                createdAt: new Date().toISOString(),
                streak: 0,
                lastActiveDate: new Date().toISOString().split('T')[0],
            });
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const signInWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const { user: googleUser } = await signInWithPopup(auth, provider);
            const snap = await getDoc(doc(db, 'users', googleUser.uid));
            if (!snap.exists()) {
                await createUserProfile(googleUser.uid, {
                    email: googleUser.email ?? '',
                    displayName: googleUser.displayName ?? 'Student',
                    role: 'student',
                    createdAt: new Date().toISOString(),
                    streak: 0,
                    lastActiveDate: new Date().toISOString().split('T')[0],
                });
            }
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
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
                signInWithGoogle,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
