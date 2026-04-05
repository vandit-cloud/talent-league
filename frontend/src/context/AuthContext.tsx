import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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
  signupRecruiter: (data: {
    name: string;
    email: string;
    password: string;
    companyName: string;
    gstNumber?: string;
    cinNumber?: string;
    udyamNumber?: string;
  }) => Promise<any>;
  updateProfile: (profile: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    avatar?: string;
  }) => Promise<User>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const safeJson = async (response: Response) => {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return {}; }
};

const normalizeAuthUser = (data: any): User => ({
  ...data,
  id: data._id || data.id,
  avatar: data.avatar || undefined,
  contactInfo: data.contactInfo || {},
  onboardingComplete: data.onboardingComplete || false,
  companyName: data.companyName || undefined,
  gstNumber: data.gstNumber || undefined,
  cinNumber: data.cinNumber || undefined,
  udyamNumber: data.udyamNumber || undefined,
  companyVerified: data.companyVerified || false,
  verificationStatus: data.verificationStatus || 'not_required',
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
  const [isLoading, setIsLoading] = useState(false);

  // SECURITY: viewRole is derived from the server-validated user.role, not localStorage
  const [viewRole, setViewRoleState] = useState<UserRole>(() => {
    try {
      const savedUser = localStorage.getItem('user');
      const userObj = savedUser ? JSON.parse(savedUser) : null;
      if (userObj && userObj.role) {
        return userObj.role as UserRole;
      }
      return 'candidate';
    } catch {
      return 'candidate';
    }
  });

  const setViewRole = (role: UserRole) => {
    setViewRoleState(role);
    localStorage.setItem('viewRole', role);
  };

  const setAuthSession = useCallback((authUser: User, token?: string | null) => {
    setUser(authUser);
    localStorage.setItem('user', JSON.stringify(authUser));

    if (authUser.role) {
      setViewRoleState(authUser.role);
      localStorage.setItem('viewRole', authUser.role);
    }

    if (token) {
      localStorage.setItem('token', token);
    }
  }, []);

  // SECURITY: On app load, verify the token with the server via /auth/me
  // This ensures tampered localStorage data is rejected
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('token');
      if (!token || !user) return;

      setIsLoading(true);
      try {
        const response = await fetch(getApiUrl('/auth/me'), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          // Token is invalid or expired - force logout
          console.warn('Session verification failed, logging out.');
          setUser(null);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('viewRole');
          return;
        }

        const data = await safeJson(response);
        const freshUser = normalizeAuthUser(data);

        // Update local state with server-validated data
        setUser(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
        setViewRoleState(freshUser.role);
        localStorage.setItem('viewRole', freshUser.role);
      } catch {
        // Network error - keep existing session but don't trust it for role checks
        console.warn('Could not verify session - network error');
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string, role?: UserRole) => {
    const response = await fetch(getApiUrl('/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });

    const data = await safeJson(response);

    if (!response.ok) {
      console.error('Login failed:', data.message);
      throw new Error(data.message || 'Login failed');
    }

    const userData = normalizeAuthUser(data);

    setAuthSession(userData, data.token);
    return userData;
  };

  const signup = async (name: string, email: string, password: string, _role: UserRole): Promise<any> => {
    // SECURITY: Candidate signup only - role is always 'candidate' on backend
    const response = await fetch(getApiUrl('/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await safeJson(response);

    if (!response.ok) {
      throw new Error(data.message || 'Signup failed');
    }

    if (data.emailVerificationPending) {
      return data;
    }

    const userData = normalizeAuthUser(data);
    setAuthSession(userData, data.token);
    return userData;
  };

  const signupRecruiter = async (formData: {
    name: string;
    email: string;
    password: string;
    companyName: string;
    gstNumber?: string;
    cinNumber?: string;
    udyamNumber?: string;
  }): Promise<any> => {
    const response = await fetch(getApiUrl('/auth/register-recruiter'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await safeJson(response);

    if (!response.ok) {
      throw new Error(data.message || 'Recruiter signup failed');
    }

    return data;
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

    const data = await safeJson(response);

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
    <AuthContext.Provider value={{ user, viewRole, setViewRole, setAuthSession, login, logout, signup, signupRecruiter, updateProfile, isLoading }}>
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
