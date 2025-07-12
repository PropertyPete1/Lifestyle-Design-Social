import axios, { AxiosResponse, AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import {
  ApiResponse,
  User,
  Video,
  Post,
  Analytics,
  DashboardStats,
  SocialPlatformConnection,
  LoginForm,
  RegisterForm,
  VideoUploadForm,
  PostScheduleForm,
  PaginatedResponse,
  PaginationParams,
} from './types';

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (error.response?.status && error.response.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.message === 'Network Error') {
      toast.error('Network error. Please check your connection.');
    }
    return Promise.reject(error);
  }
);

// Helper function to handle API responses
const handleResponse = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
  const { data } = response;
  if (!data.success && data.error) {
    throw new Error(data.error);
  }
  return data.data as T;
};

// Auth API
export const authApi = {
  login: async (credentials: LoginForm): Promise<{ user: User; token: string }> => {
    const response = await api.post('/api/auth/login', credentials);
    return handleResponse(response);
  },

  register: async (userData: RegisterForm): Promise<{ user: User; token: string }> => {
    const response = await api.post('/api/auth/register', userData);
    return handleResponse(response);
  },

  logout: async (): Promise<void> => {
    await api.post('/api/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/api/auth/me');
    return handleResponse(response);
  },

  refreshToken: async (): Promise<{ token: string }> => {
    const response = await api.post('/api/auth/refresh');
    return handleResponse(response);
  },
};

// Videos API
export const videosApi = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Video>> => {
    const response = await api.get('/api/videos', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Video> => {
    const response = await api.get(`/api/videos/${id}`);
    return handleResponse(response);
  },

  upload: async (formData: FormData, onProgress?: (progress: number) => void): Promise<Video> => {
    const response = await api.post('/api/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return handleResponse(response);
  },

  update: async (id: string, data: Partial<Video>): Promise<Video> => {
    const response = await api.put(`/api/videos/${id}`, data);
    return handleResponse(response);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/videos/${id}`);
  },

  markAsPosted: async (id: string): Promise<Video> => {
    const response = await api.post(`/api/videos/${id}/mark-posted`);
    return handleResponse(response);
  },

  getNext: async (category: string): Promise<Video> => {
    const response = await api.get(`/api/videos/next/${category}`);
    return handleResponse(response);
  },
};

// Posts API
export const postsApi = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Post>> => {
    const response = await api.get('/api/posts', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Post> => {
    const response = await api.get(`/api/posts/${id}`);
    return handleResponse(response);
  },

  schedule: async (data: PostScheduleForm): Promise<Post[]> => {
    const response = await api.post('/api/posts/schedule', data);
    return handleResponse(response);
  },

  update: async (id: string, data: Partial<Post>): Promise<Post> => {
    const response = await api.put(`/api/posts/${id}`, data);
    return handleResponse(response);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/posts/${id}`);
  },

  getScheduled: async (): Promise<Post[]> => {
    const response = await api.get('/api/posts/scheduled');
    return handleResponse(response);
  },

  markAsPosted: async (id: string, metrics?: any): Promise<Post> => {
    const response = await api.post(`/api/posts/${id}/mark-posted`, { engagementMetrics: metrics });
    return handleResponse(response);
  },

  markAsFailed: async (id: string, error: string): Promise<Post> => {
    const response = await api.post(`/api/posts/${id}/mark-failed`, { errorMessage: error });
    return handleResponse(response);
  },
};

// Analytics API
export const analyticsApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/api/analytics/overview');
    return handleResponse(response);
  },

  getOverview: async (timeframe?: string): Promise<Analytics> => {
    const response = await api.get('/api/analytics/overview', { params: { timeframe } });
    return handleResponse(response);
  },

  getPlatformStats: async (platform?: string): Promise<Analytics[]> => {
    const response = await api.get('/api/analytics/platforms', { params: { platform } });
    return handleResponse(response);
  },

  getEngagementTrends: async (days: number = 30): Promise<any> => {
    const response = await api.get('/api/analytics/engagement', { params: { days } });
    return handleResponse(response);
  },

  getVideoPerformance: async (videoId: string): Promise<any> => {
    const response = await api.get(`/api/analytics/video/${videoId}`);
    return handleResponse(response);
  },

  getOptimalTimes: async (): Promise<any> => {
    const response = await api.get('/api/analytics/optimal-times');
    return handleResponse(response);
  },
};

// Platforms API
export const platformsApi = {
  getConnections: async (): Promise<SocialPlatformConnection[]> => {
    const response = await api.get('/api/platforms/connections');
    return handleResponse(response);
  },

  connect: async (platform: string): Promise<{ authUrl: string }> => {
    const response = await api.post(`/api/platforms/connect/${platform}`);
    return handleResponse(response);
  },

  disconnect: async (platform: string): Promise<void> => {
    await api.delete(`/api/platforms/disconnect/${platform}`);
  },

  getStatus: async (): Promise<Record<string, any>> => {
    const response = await api.get('/api/platforms/status');
    return handleResponse(response);
  },

  refreshToken: async (platform: string): Promise<void> => {
    await api.post(`/api/platforms/refresh/${platform}`);
  },
};

// Settings API
export const settingsApi = {
  getProfile: async (): Promise<User> => {
    const response = await api.get('/api/settings/profile');
    return handleResponse(response);
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put('/api/settings/profile', data);
    return handleResponse(response);
  },

  getPreferences: async (): Promise<any> => {
    const response = await api.get('/api/settings/preferences');
    return handleResponse(response);
  },

  updatePreferences: async (data: any): Promise<any> => {
    const response = await api.put('/api/settings/preferences', data);
    return handleResponse(response);
  },

  getApiKeys: async (): Promise<any> => {
    const response = await api.get('/api/settings/api-keys');
    return handleResponse(response);
  },

  updateApiKeys: async (data: any): Promise<any> => {
    const response = await api.put('/api/settings/api-keys', data);
    return handleResponse(response);
  },

  getSchedule: async (): Promise<any> => {
    const response = await api.get('/api/settings/schedule');
    return handleResponse(response);
  },

  updateSchedule: async (data: any): Promise<any> => {
    const response = await api.put('/api/settings/schedule', data);
    return handleResponse(response);
  },
};

// AI API
export const aiApi = {
  generateCaption: async (videoId: string, style?: string): Promise<{ caption: string; hashtags: string[] }> => {
    const response = await api.post('/api/ai/generate-caption', { videoId, style });
    return handleResponse(response);
  },

  analyzeVideo: async (videoId: string): Promise<any> => {
    const response = await api.post('/api/ai/analyze-video', { videoId });
    return handleResponse(response);
  },

  getHashtagSuggestions: async (category: string): Promise<string[]> => {
    const response = await api.get(`/api/ai/hashtags/${category}`);
    return handleResponse(response);
  },

  optimizePosting: async (userId: string): Promise<any> => {
    const response = await api.post('/api/ai/optimize-posting', { userId });
    return handleResponse(response);
  },
};

// Health API
export const healthApi = {
  check: async (): Promise<{ status: string; timestamp: string }> => {
    const response = await api.get('/api/health');
    return handleResponse(response);
  },
};

// Export the main API object
export const apiClient = {
  auth: authApi,
  videos: videosApi,
  posts: postsApi,
  analytics: analyticsApi,
  platforms: platformsApi,
  settings: settingsApi,
  ai: aiApi,
  health: healthApi,
};

export default apiClient; 