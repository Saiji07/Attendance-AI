import axios from 'axios';

const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: VITE_API_BASE_URL,
  timeout: 30000,
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  try {
    // Get token from Clerk
    if (typeof window !== 'undefined') {
      // Try to get the token from Clerk
      const clerkToken = await window.Clerk?.session?.getToken();
      if (clerkToken) {
        config.headers.Authorization = `Bearer ${clerkToken}`;
      }
    }
  } catch (error) {
    console.warn('Failed to get auth token:', error);
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Authentication failed. Please sign in again.');
      // Optionally redirect to sign-in page
      if (typeof window !== 'undefined') {
        window.location.href = '/sign-in';
      }
    }
    return Promise.reject(error);
  }
);

// API functions
export const authAPI = {
  syncUser: (userData: any) => api.post('/auth/sync', { user: userData }),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
};

export const classroomAPI = {
  create: (data: any) => api.post('/classrooms', data),
  getAll: () => api.get('/classrooms'),
  getById: (id: string) => api.get(`/classrooms/${id}`),
  uploadGroupPhoto: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/classrooms/${id}/upload-group-photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  assignStudents: (id: string, assignments: any) => 
    api.post(`/classrooms/${id}/assign-students`, { assignments }),
  trainModel: (id: string, config: any = {}) => 
    api.post(`/classrooms/${id}/train-model`, config),
  delete: (id: string) => api.delete(`/classrooms/${id}`),
};

export const attendanceAPI = {
  take: (classroomId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/attendance/${classroomId}/take`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getHistory: (classroomId: string, page = 1, limit = 10) => 
    api.get(`/attendance/${classroomId}/history?page=${page}&limit=${limit}`),
  getAnalytics: (classroomId: string) => 
    api.get(`/attendance/${classroomId}/analytics`),
};

export default api;