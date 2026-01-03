import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useApi } from '../hooks/useApi';
import { AuthResponse } from '../types/api';
import { User, UserResponse } from '../types/user';

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
  resetPassword: (
    email: string,
    code: string,
    newPassword: string
  ) => Promise<{ success: boolean }>;
  sendPasswordResetCode: (email: string) => Promise<{ success: boolean }>;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

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
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });
  const [isLoading, setIsLoading] = useState(true);

  // Usando o hook useApi para todas as chamadas
  const authApi = useApi<AuthResponse>('default');
  const profileApi = useApi<UserResponse>('default'); // Para chamadas de perfil

  // Configurar token no localStorage e headers
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  // Verificar token ao iniciar
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const response = await profileApi.get('/auth/me');
          if (response.success) {
            setUser(response.data);
          }
        } catch (error) {
          console.error('Invalid token:', error);
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    verifyToken();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.post('/auth/login', { email, password });
      console.log('Resultado do login:', response);

      if (response.token && response.user) {
        const { token: authToken, user: userData } = response;
        setToken(authToken);
        setUser(userData);
        return { success: true, user: userData };
      }

      return { success: false };
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (googleToken: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.post('/auth/google', { token: googleToken });

      if (response.success && response.data) {
        const { token: authToken, user: userData } = response.data;
        setToken(authToken);
        setUser(userData);
        return { success: true, user: userData };
      }

      return { success: false };
    } catch (error: any) {
      throw new Error(error.message || 'Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithPhone = async (phone: string, code: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.post('/auth/verify-code', { phone, code });

      if (response.token && response.user) {
        const { token: authToken, user: userData } = response;
        setToken(authToken);
        setUser(userData);
        return { success: true, user: userData };
      }

      return { success: false };
    } catch (error: any) {
      throw new Error(error.message || 'Phone verification failed');
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
      const response = await authApi.post('/auth/register', data);

      if (response.success && response.data) {
        const { token: authToken, user: userData } = response.data;
        setToken(authToken);
        setUser(userData);
        return { success: true, user: userData };
      }

      return { success: false };
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    authApi.reset();
    profileApi.reset();
  };

  const sendVerificationCode = async (phone: string) => {
    try {
      const response = await authApi.post('/auth/send-verification-code', { phone });
      return { success: response.success };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send verification code');
    }
  };

  const verifyPhoneCode = async (phone: string, code: string) => {
    try {
      const response = await authApi.post('/auth/verify-code-create', { phone, code });
      if (response.token && response.user) {
        const { token: authToken, user: userData } = response;
        setToken(authToken);
        setUser(userData);
        return { success: true, user: userData };
      }
      return { success: false };
    } catch (error: any) {
      throw new Error(error.message || 'Invalid verification code');
    }
  };

  const sendEmailVerificationCode = async (email: string) => {
    try {
      const response = await authApi.post('/auth/send-email-verification-code', { email });
      return { success: response.success };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send email verification code');
    }
  };

  const verifyEmailCode = async (email: string, code: string) => {
    try {
      const response = await authApi.post('/auth/verify-email-code', { email, code });

      if (response.success && response.data) {
        const { token: authToken, user: userData } = response.data;
        setToken(authToken);
        setUser(userData);
        return { success: true, user: userData };
      }

      return { success: false };
    } catch (error: any) {
      throw new Error(error.message || 'Invalid email verification code');
    }
  };

  const sendPasswordResetCode = async (email: string) => {
    try {
      const response = await authApi.post('/auth/send-password-reset-code', { email });
      return { success: response.success };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send password reset code');
    }
  };

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    try {
      const response = await authApi.post('/auth/reset-password', { email, code, newPassword });
      return { success: response.success };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to reset password');
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...userData } : null));
  };

  const refreshUser = async () => {
    try {
      const response = await profileApi.get('/auth/me');
      if (response.success && response.data) {
        setUser(response.data);
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
    resetPassword,
    sendPasswordResetCode,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
