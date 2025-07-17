'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

// Simplified User interface for frontend context (avoid duplication with shared package)
interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role?: string;
  autoPostingEnabled?: boolean;
  company?: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  company?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check if we're on the client side
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await apiClient.get('/auth/me');
      // Handle different response formats
      const userData = response.data.user || response.data.data?.user || response.data;
      // Map backend 'name' field to frontend 'username' field for compatibility
      const mappedUserData = {
        ...userData,
        username: userData.name || userData.username || userData.email.split('@')[0]
      };
      setUser(mappedUserData);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      
      // Handle different response formats
      const token = response.data.token || response.data.data?.token;
      const userData = response.data.user || response.data.data?.user;
      
      if (token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
        }
        // Map backend 'name' field to frontend 'username' field for compatibility
        const mappedUserData = {
          ...userData,
          username: userData.name || userData.username || userData.email.split('@')[0]
        };
        setUser(mappedUserData);
        return { success: true };
      }
      
      return { success: false, error: 'Invalid credentials' };
    } catch (error: unknown) {
      let errorMessage = 'Login failed';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string; message?: string } } };
        if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error;
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      
      // Handle different response formats
      const token = response.data.token || response.data.data?.token;
      const user = response.data.user || response.data.data?.user;
      
      if (token) {
        localStorage.setItem('token', token);
        // Map backend 'name' field to frontend 'username' field for compatibility
        const mappedUserData = {
          ...user,
          username: user.name || user.username || user.email.split('@')[0]
        };
        setUser(mappedUserData);
        return { success: true };
      }
      
      return { success: false, error: 'Registration failed' };
    } catch (error: unknown) {
      let errorMessage = 'Registration failed';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string; message?: string } } };
        if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error;
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 