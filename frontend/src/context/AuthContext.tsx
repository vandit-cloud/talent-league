import { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { getApiUrl } from '../lib/api/base';

interface AuthContextType {
  user: User | null;
  viewRole: UserRole;
  setViewRole: (role: UserRole) => void;
  setAuthSession: (authUser: User, token?: string | null) => void;
  login: (email: string, password: string, role?: UserRole) => Promise<User>;
  logout: () => void;
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<User>;
  updateProfile: (profile: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    avatar?: string;
  }) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeAuthUser = (data: any): User => ({
  ...data,
  id: data._id || data.id,
  avatar: data.avatar || undefined,
  contactInfo: data.contactInfo || {},
  onboardingComplete: data.onboardingComplete || false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [viewRole, setViewRoleState] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem('viewRole') as UserRole | null;
      const savedUser = localStorage.getItem('user');
      const userObj = savedUser ? JSON.parse(savedUser) : null;
      
      // If we have a saved viewRole, trust it ONLY if it matches the user's base capabilities
      if (saved === 'candidate' || saved === 'recruiter' || saved === 'admin') {
        return saved;
      }
      
      // Fallback: Use the actual role from the user object if available
      if (userObj && userObj.role) {
        return userObj.role as UserRole;
      }
      
      return 'candidate';
    } catch (err) {
      console.error('Error initializing viewRole:', err);
      return 'candidate';
    }
  });

  const setViewRole = (role: UserRole) => {
    setViewRoleState(role);
    localStorage.setItem('viewRole', role);
  };

  const setAuthSession = (authUser: User, token?: string | null) => {
    setUser(authUser);
    localStorage.setItem('user', JSON.stringify(authUser));

    if (authUser.role) {
      setViewRole(authUser.role);
    }

    if (token) {
      localStorage.setItem('token', token);
    }
  };

  const login = async (email: string, password: string, role?: UserRole) => {
    const response = await fetch(getApiUrl('/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Login failed:', data.message);
      throw new Error(data.message || 'Login failed');
    }

    const userData = normalizeAuthUser(data);

    setAuthSession(userData, data.token);
    return userData;
  };

  const signup = async (name: string, email: string, password: string, role: UserRole) => {
    const response = await fetch(getApiUrl('/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Signup failed');
    }

    const userData = normalizeAuthUser(data);
    return userData;
  };

  const updateProfile = async (profile: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    avatar?: string;
  }) => {
    const token = localStorage.getItem('token');

    const response = await fetch(getApiUrl('/auth/profile'), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(profile),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile');
    }

    const updatedUser = normalizeAuthUser(data);
    setAuthSession(updatedUser, data.token || token);
    return updatedUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('viewRole');
  };

  return (
    <AuthContext.Provider value={{ user, viewRole, setViewRole, setAuthSession, login, logout, signup, updateProfile }}>
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
