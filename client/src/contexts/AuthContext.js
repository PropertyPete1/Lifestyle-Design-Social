import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
};

const authReducer = (state, action) => {
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

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set auth token for axios requests
  useEffect(() => {
    if (state.token) {
      axios.defaults.headers.common['x-auth-token'] = state.token;
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
    }
  }, [state.token]);

  // Load user on app start
  useEffect(() => {
    const loadUser = async () => {
      if (state.token) {
        try {
          const res = await axios.get('/api/auth/me');
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user: res.data, token: state.token },
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

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: res.data,
      });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'LOGIN_FAIL' });
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const res = await axios.post('/api/auth/register', userData);
      localStorage.setItem('token', res.data.token);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: res.data,
      });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'LOGIN_FAIL' });
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  const connectSocialAccount = async (platform, credentials) => {
    try {
      const endpoint = platform === 'twitter' ? '/api/auth/connect-twitter' : '/api/auth/connect-instagram';
      const res = await axios.post(endpoint, credentials);
      
      // Update user with new social account info
      const updatedUser = { ...state.user, socialAccounts: res.data.socialAccounts };
      updateUser(updatedUser);
      
      return { success: true, message: res.data.message };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Connection failed' };
    }
  };

  const disconnectSocialAccount = async (platform) => {
    try {
      await axios.delete(`/api/auth/disconnect/${platform}`);
      
      // Update user with disconnected social account info
      const updatedUser = { ...state.user };
      if (platform === 'twitter') {
        updatedUser.socialAccounts.twitter = {
          connected: false,
          username: null,
          accessToken: null,
          accessSecret: null
        };
      } else if (platform === 'instagram') {
        updatedUser.socialAccounts.instagram = {
          connected: false,
          username: null,
          accessToken: null
        };
      }
      updateUser(updatedUser);
      
      return { success: true };
    } catch (error) {
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export the context as well for direct access
export { AuthContext }; 