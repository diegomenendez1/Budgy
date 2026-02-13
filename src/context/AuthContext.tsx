import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// LOCAL AUTH TYPES
// Defining local interfaces to replace @supabase/supabase-js types
export interface User {
    id: string;
    email: string;
    full_name: string;
    created_at: string;
}

export interface Session {
    access_token: string;
    user: User;
    expires_at: number;
}

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
    signInAsGuest: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
    register: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initialize from LocalStorage
        const initAuth = () => {
            try {
                const storedSession = localStorage.getItem('budgy_session');
                if (storedSession) {
                    const parsedSession = JSON.parse(storedSession);
                    setSession(parsedSession);
                    setUser(parsedSession.user);
                } else {
                    // Force a stable dummy user for development and consistent local data
                    const guestUser = createMockUser('dev@budgy.local', 'Desarrollador', 'local-user');
                    setUser(guestUser);
                    setSession({
                        access_token: 'local-dev-token',
                        user: guestUser,
                        expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 365
                    });
                }
            } catch (error) {
                console.error("Local Auth Init Error:", error);
                localStorage.removeItem('budgy_session');
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, []);

    // Helper to simulate network delay
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const signInAsGuest = async () => {
        await delay(500);
        const guestUser = createMockUser('guest@budgy.local', 'Invitado');
        createSession(guestUser);
    };

    const signInWithEmail = async (email: string, password: string) => {
        await delay(800); // Simulate network
        const users = JSON.parse(localStorage.getItem('budgy_users') || '[]');
        const foundUser = users.find((u: any) => u.email === email && u.password === password);

        if (foundUser) {
            const userObj = createMockUser(foundUser.email, foundUser.full_name, foundUser.id);
            createSession(userObj);
            return { error: null };
        } else {
            return { error: { message: "Credenciales inválidas (Modo Local)" } };
        }
    };

    const register = async (email: string, password: string, fullName: string) => {
        await delay(800);
        const users = JSON.parse(localStorage.getItem('budgy_users') || '[]');

        if (users.find((u: any) => u.email === email)) {
            return { error: { message: "El usuario ya existe (Modo Local)" } };
        }

        const newUser = {
            id: crypto.randomUUID(),
            email,
            password,
            full_name: fullName,
            created_at: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('budgy_users', JSON.stringify(users));

        const userObj = createMockUser(newUser.email, newUser.full_name, newUser.id);
        createSession(userObj);
        return { error: null };
    };

    const signInWithGoogle = async () => {
        console.log("Google Login simulated in Local Mode");
        await signInAsGuest();
    };

    const signOut = async () => {
        await delay(300);
        localStorage.removeItem('budgy_session');
        setUser(null);
        setSession(null);
    };

    // Private helpers
    const createMockUser = (email: string, fullName: string, id?: string): User => {
        return {
            id: id || crypto.randomUUID(),
            email: email,
            full_name: fullName,
            created_at: new Date().toISOString(),
        };
    };

    const createSession = (user: User) => {
        const newSession: Session = {
            access_token: 'local-mock-token-' + Date.now(),
            user: user,
            expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 7
        };

        localStorage.setItem('budgy_session', JSON.stringify(newSession));
        setSession(newSession);
        setUser(user);
    };

    return (
        <AuthContext.Provider value={{ session, user, loading, signOut, signInAsGuest, signInWithGoogle, signInWithEmail, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
