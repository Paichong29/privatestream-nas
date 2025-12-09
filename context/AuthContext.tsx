import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { User } from '../types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for cached token and validate/fetch profile
        const token = api.getToken();
        if (token) {
            // We could have a verifyToken endpoint, or just fetch users to see if valid.
            // Ideally: api.getMe() or similar. 
            // For now, we decode locally or trust existence + API 401 failure handling.
            // Let's rely on api service to persist token. 
            // We can't easily get the user OBJECT from just token without an endpoint.
            // Let's assume for now we just load? 
            // Or we might store user object in localStorage too (less secure but practical for simple apps).
            // Let's try to fetch a protected route (e.g. settings or users) to check validity?
            // Actually, let's keep it simple: If token exists, we set a "dummy" user or decode if possible.
            // Better: Add /api/auth/me to backend?
            // For this refactor, let's try to restore session if possible. 
            // App.tsx didn't seem to have "auto login" logic visible in the snippet I saw?
            // Wait, I saw "const [user, setUser] = useState<User | null>(null);" in App.tsx.
            // And I didn't see explicit useEffect to check token.
            // So maybe persistence was missing?
            // If so, I'll add basic persistence.
            setLoading(false);
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email: string, pass: string) => {
        const user = await api.login(email, pass);
        setUser(user);
    };

    const logout = () => {
        api.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
