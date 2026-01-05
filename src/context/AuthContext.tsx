import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { User } from '../types/user';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<{ success: boolean; user?: User }>;
  loginWithGoogle: (token: string) => Promise<{ success: boolean; user?: User }>;
  loginWithPhone: (phone: string, code: string) => Promise<{ success: boolean; user?: User }>;
  register: (data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone: string;
  }) => Promise<{ success: boolean; user?: User }>;

  logout: () => void;

  sendVerificationCode: (phone: string) => Promise<{ success: boolean }>;
  verifyPhoneCode: (phone: string, code: string) => Promise<{ success: boolean; user?: User }>;

  sendEmailVerificationCode: (email: string) => Promise<{ success: boolean }>;
  verifyEmailCode: (email: string, code: string) => Promise<{ success: boolean; user?: User }>;

  sendPasswordResetCode: (email: string) => Promise<{ success: boolean }>;
  resetPassword: (
    email: string,
    code: string,
    newPassword: string
  ) => Promise<{ success: boolean }>;

  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

type AuthPayload = {
  token: string;
  user: User;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  const authApi = api;

  // ================= TOKEN STORAGE =================
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  // ================= VERIFY TOKEN =================
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await authApi.get<User>('/auth/me');

        if (userData) {
          setUser(userData);
        }
      } catch (error) {
        console.error('Invalid token:', error);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  // ================= AUTH METHODS =================

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const response = await authApi.post<AuthPayload>('/auth/login', {
        email,
        password,
      });

      if (response && response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        return { success: true, user: response.user };
      }

      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (googleToken: string) => {
    try {
      setIsLoading(true);

      const response = await authApi.post<AuthPayload>('/auth/google', {
        token: googleToken,
      });

      if (response && response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        return { success: true, user: response.user };
      }

      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithPhone = async (phone: string, code: string) => {
    try {
      setIsLoading(true);

      const response = await authApi.post<AuthPayload>('/auth/verify-code', {
        phone,
        code,
      });

      if (response && response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        return { success: true, user: response.user };
      }

      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone: string;
  }) => {
    try {
      setIsLoading(true);

      const response = await authApi.post<AuthPayload>('/auth/register', data);

      if (response && response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        return { success: true, user: response.user };
      }

      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  // ================= AUX METHODS =================

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const sendVerificationCode = async (phone: string) => {
    const response = await authApi.post<boolean>('/auth/send-verification-code', { phone });

    return { success: !!response };
  };

  const verifyPhoneCode = async (phone: string, code: string) => {
    const response = await authApi.post<AuthPayload>('/auth/verify-code-create', { phone, code });

    if (response && response.token && response.user) {
      setToken(response.token);
      setUser(response.user);
      return { success: true, user: response.user };
    }

    return { success: false };
  };

  const sendEmailVerificationCode = async (email: string) => {
    const response = await authApi.post<boolean>('/auth/send-email-verification-code', { email });

    return { success: !!response };
  };

  const verifyEmailCode = async (email: string, code: string) => {
    const response = await authApi.post<AuthPayload>('/auth/verify-email-code', { email, code });

    if (response && response.token && response.user) {
      setToken(response.token);
      setUser(response.user);
      return { success: true, user: response.user };
    }

    return { success: false };
  };

  const sendPasswordResetCode = async (email: string) => {
    const response = await authApi.post<boolean>('/auth/send-password-reset-code', { email });

    return { success: !!response };
  };

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    const response = await authApi.post<boolean>('/auth/reset-password', {
      email,
      code,
      newPassword,
    });

    return { success: !!response };
  };

  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...userData } : null));
  };

  const refreshUser = async () => {
    try {
      const userData = await authApi.get<User>('/auth/me');
      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,

    login,
    loginWithGoogle,
    loginWithPhone,
    register,
    logout,

    sendVerificationCode,
    verifyPhoneCode,
    sendEmailVerificationCode,
    verifyEmailCode,

    sendPasswordResetCode,
    resetPassword,

    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
