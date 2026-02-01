import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
// import { supabase } from '../lib/supabase';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
    signInAsGuest: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    // State for local user persistence
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing local user on mount
        const initAuth = () => {
            try {
                const storedUser = localStorage.getItem('budgy_local_user');
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                    setSession({
                        user: parsedUser,
                        access_token: 'local-token',
                        refresh_token: 'local-refresh-token',
                        expires_in: 3600,
                        token_type: 'bearer'
                    });
                }
            } catch (error) {
                console.error("Auth init error", error);
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, []);

    const signInAsGuest = async () => {
        const newUser = {
            id: 'local-user-' + Date.now(),
            app_metadata: {},
            user_metadata: { full_name: 'Usuario Local' },
            aud: 'authenticated',
            created_at: new Date().toISOString()
        } as User;

        const newSession = {
            user: newUser,
            access_token: 'local-token-' + Date.now(),
            refresh_token: 'local-refresh-token',
            expires_in: 3600,
            token_type: 'bearer'
        };

        localStorage.setItem('budgy_local_user', JSON.stringify(newUser));
        setUser(newUser);
        setSession(newSession);
    };

    const signOut = async () => {
        if (confirm("¿Estás seguro? Al salir en modo local se borrarán tus datos de este dispositivo si borras el caché.")) {
            // For now we just 'lock' the app, effectively routing to Welcome
            // But we DON'T delete the data from DB in this simplified logout
            localStorage.removeItem('budgy_local_user');
            setUser(null);
            setSession(null);
        }
    };

    return (
        <AuthContext.Provider value={{ session, user, loading, signOut, signInAsGuest }}>
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
