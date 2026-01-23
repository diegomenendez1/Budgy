import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
// import { supabase } from '../lib/supabase';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    // "Logged in" by default with a local user
    const [user] = useState<User | null>({
        id: 'local-user',
        app_metadata: {},
        user_metadata: { full_name: 'Local User' },
        aud: 'authenticated',
        created_at: new Date().toISOString()
    } as User);

    const [session] = useState<Session | null>({
        user: { id: 'local-user' } as User,
        access_token: 'local-token',
        refresh_token: 'local-refresh-token',
        expires_in: 3600,
        token_type: 'bearer'
    });

    const [loading, setLoading] = useState(false);

    const signOut = async () => {
        // No-op for local mode, or maybe reset local data?
        // For now, we just reload or do nothing as "Logout" doesn't make sense in offline-first without multi-user
        if (confirm("Reset local data? This cannot be undone.")) {
            // Optional: logic to clear DB
            // await db.delete();
            // window.location.reload();
            alert("To reset data, please clear browser data for this site manually for safety.");
        }
    };

    return (
        <AuthContext.Provider value={{ session, user, loading, signOut }}>
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
