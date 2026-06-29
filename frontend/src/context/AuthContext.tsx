import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../api';

interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: any) => Promise<any>;
  register: (data: any) => Promise<any>;
  verifyOtp: (email: string, otp: string) => Promise<any>;
  resendOtp: (email: string) => Promise<any>;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (data: any) => Promise<any>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const bootstrapAuth = async () => {
      if (token) {
        try {
          const response = await api.get('/profile');
          setUser(response.data.data);
        } catch (error) {
          console.error("Failed to load user profile:", error);
          // Revoke local session if token is invalid or expired
          localStorage.removeItem('auth_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    bootstrapAuth();
  }, [token]);

  const login = async (credentials: any) => {
    try {
      const response = await api.post('/login', credentials);
      const { user: loggedInUser, token: authToken } = response.data.data;
      
      localStorage.setItem('auth_token', authToken);
      setToken(authToken);
      setUser(loggedInUser);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: any) => {
    try {
      const response = await api.post('/register', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    try {
      const response = await api.post('/verify-otp', { email, otp });
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const resendOtp = async (email: string) => {
    try {
      const response = await api.post('/resend-otp', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const response = await api.post('/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (data: any) => {
    try {
      const response = await api.post('/reset-password', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error("Logout failed on server:", error);
    } finally {
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
    }
  };

  const hasRole = (role: string) => {
    return user?.roles.includes(role) ?? false;
  };

  const hasPermission = (permission: string) => {
    return user?.permissions.includes(permission) ?? false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        verifyOtp,
        resendOtp,
        forgotPassword,
        resetPassword,
        logout,
        hasRole,
        hasPermission,
      }}
    >
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
