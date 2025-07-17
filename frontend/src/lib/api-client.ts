import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Get base URL from environment or default
const getBaseURL = (): string => {
  if (typeof window !== 'undefined') {
    // Client-side: use relative path for Next.js proxy
    return '/api';
  } else {
    // Server-side: use full URL
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  }
};

// Create axios instance with base configuration
export const apiClient: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authentication token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // Handle network errors
    if (!error.response) {
      // Network error - will be handled by calling component
    }
    
    return Promise.reject(error);
  }
);

// Helper function to create API client with custom config
export const createApiClient = (config: Record<string, unknown> = {}): AxiosInstance => {
  return axios.create({
    baseURL: getBaseURL(),
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
    ...config,
  });
};

// Export default instance
export default apiClient; 