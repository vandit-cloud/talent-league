import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type UserRole = 'candidate' | 'recruiter' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<User>;
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  getBackendUrl: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://talent-league-api.onrender.com';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('tl_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const getBackendUrl = useCallback(() => {
    return (localStorage.getItem('tl_backend_url') || DEFAULT_BACKEND_URL).replace(/\/+$/, '');
  }, []);

  const login = useCallback(async (email: string, password: string, role?: UserRole): Promise<User> => {
    const res = await fetch(`${getBackendUrl()}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }

    const userData: User = {
      id: data._id || data.id,
      name: data.name,
      email: data.email,
      role: data.role || 'candidate',
      avatar: data.avatar,
      token: data.token,
    };

    setUser(userData);
    localStorage.setItem('tl_user', JSON.stringify(userData));
    if (data.token) {
      localStorage.setItem('tl_token', data.token);
    }

    return userData;
  }, [getBackendUrl]);

  const signup = useCallback(async (name: string, email: string, password: string, role: UserRole): Promise<void> => {
    const res = await fetch(`${getBackendUrl()}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Signup failed');
    }
  }, [getBackendUrl]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('tl_user');
    localStorage.removeItem('tl_token');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        getBackendUrl,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
