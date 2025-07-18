'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

// Real User interface matching backend response
interface User {
  id: string;
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
      
      // Handle backend response format: { success: true, data: { user: {...} } }
      if (response.data.success && response.data.data?.user) {
        const userData = response.data.data.user;
        const mappedUserData = {
          id: userData.id || userData._id,
          username: userData.username || userData.name || userData.email.split('@')[0],
          name: userData.name,
          email: userData.email,
          role: userData.role,
          autoPostingEnabled: userData.autoPostingEnabled,
          company: userData.company
        };
        setUser(mappedUserData);
      } else {
        // Invalid response, remove token
        localStorage.removeItem('token');
      }
    } catch (error) {
      // Auth check failed, remove invalid token
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      
      // Handle backend response format: { success: true, data: { token, user } }
      if (response.data.success && response.data.data) {
        const { token, user: userData } = response.data.data;
        
        if (token && userData) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', token);
          }
          
          const mappedUserData = {
            id: userData.id || userData._id,
            username: userData.username || userData.name || userData.email.split('@')[0],
            name: userData.name,
            email: userData.email,
            role: userData.role,
            autoPostingEnabled: userData.autoPostingEnabled,
            company: userData.company
          };
          
          setUser(mappedUserData);
          return { success: true };
        }
      }
      
      // Login failed
      return { 
        success: false, 
        error: response.data.error || 'Invalid credentials'
      };
      
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
      
      // Handle backend response format: { success: true, data: { token, user } }
      if (response.data.success && response.data.data) {
        const { token, user: userInfo } = response.data.data;
        
        if (token && userInfo) {
          localStorage.setItem('token', token);
          
          const mappedUserData = {
            id: userInfo.id || userInfo._id,
            username: userInfo.username || userInfo.name || userInfo.email.split('@')[0],
            name: userInfo.name,
            email: userInfo.email,
            role: userInfo.role,
            autoPostingEnabled: userInfo.autoPostingEnabled,
            company: userInfo.company
          };
          
          setUser(mappedUserData);
          return { success: true };
        }
      }
      
      return { 
        success: false, 
        error: response.data.error || 'Registration failed' 
      };
      
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