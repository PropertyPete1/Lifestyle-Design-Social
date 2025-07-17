import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import axios from 'axios';

// TypeScript interfaces
// Simplified User interface for client context (avoid duplication with shared package)
interface User {
  id: number;
  name: string;
  email: string;
  company?: string;
  autoPostingEnabled?: boolean;
  instagramUsername?: string;
  testMode?: boolean;
  socialAccounts?: any; // Simplified to avoid deep duplication
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userData: User) => void;
  connectSocialAccount: (platform: string, credentials: any) => Promise<{ success: boolean; error?: string; message?: string }>;
  disconnectSocialAccount: (platform: string) => Promise<{ success: boolean; error?: string }>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  company?: string;
}

type AuthAction = 
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAIL' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };
    case 'LOGIN_FAIL':
    case 'LOGOUT':
      localStorage.removeItem('token');
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set auth token for axios requests using Authorization Bearer format
  useEffect(() => {
    if (state.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [state.token]);

  // Load user on app start
  useEffect(() => {
    const loadUser = async () => {
      if (state.token) {
        try {
          const res = await axios.get('/api/auth/profile');
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user: res.data.data, token: state.token },
          });
        } catch (error) {
          dispatch({ type: 'LOGIN_FAIL' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadUser();
  }, [state.token]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      
      // Handle both old and new API response formats
      const token = res.data.token || res.data.data?.token;
      const user = res.data.user || res.data.data?.user;
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      localStorage.setItem('token', token);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { token, user },
      });
      return { success: true };
    } catch (error: any) {
      dispatch({ type: 'LOGIN_FAIL' });
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await axios.post('/api/auth/register', userData);
      
      // Handle both old and new API response formats
      const token = res.data.token || res.data.data?.token;
      const user = res.data.user || res.data.data?.user;
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      localStorage.setItem('token', token);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { token, user },
      });
      return { success: true };
    } catch (error: any) {
      dispatch({ type: 'LOGIN_FAIL' });
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    }
  };

  const logout = (): void => {
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (userData: User): void => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  const connectSocialAccount = async (platform: string, credentials: any): Promise<{ success: boolean; error?: string; message?: string }> => {
    try {
      const endpoint = platform === 'twitter' ? '/api/auth/connect-twitter' : '/api/auth/connect-instagram';
      const res = await axios.post(endpoint, credentials);
      
      // Update user with new social account info
      const updatedUser = { ...state.user!, socialAccounts: res.data.socialAccounts };
      updateUser(updatedUser);
      
      return { success: true, message: res.data.message };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Connection failed' };
    }
  };

  const disconnectSocialAccount = async (platform: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await axios.delete(`/api/auth/disconnect/${platform}`);
      
      // Update user with disconnected social account info
      const updatedUser = { ...state.user! };
      if (platform === 'twitter') {
        updatedUser.socialAccounts!.twitter = {
          connected: false,
          username: undefined,
          accessToken: undefined,
          accessSecret: undefined
        };
      } else if (platform === 'instagram') {
        updatedUser.socialAccounts!.instagram = {
          connected: false,
          username: undefined,
          accessToken: undefined
        };
      }
      updateUser(updatedUser);
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Disconnection failed' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        loading: state.loading,
        login,
        register,
        logout,
        updateUser,
        connectSocialAccount,
        disconnectSocialAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export the context as well for direct access
export { AuthContext }; 