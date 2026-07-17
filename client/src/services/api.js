import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to dynamically inject the JWT bearer token
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

// Auth endpoints
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  resetPassword: ({ email, password }) => api.post('/auth/reset-password', { email, password }),
  getMe: () => api.get('/auth/me'),
};

// Document endpoints
export const documentAPI = {
  getDocuments: () => api.get('/documents'),
  createDocument: (title, category) => api.post('/documents', { title, category }),
  getDocumentById: (id) => api.get(`/documents/${id}`),
  updateDocument: (id, data) => api.put(`/documents/${id}`, data),
  deleteDocument: (id) => api.delete(`/documents/${id}`),
  shareDocument: ({ documentId, email, role, remove }) =>
    api.post('/documents/share', { documentId, email, role, remove }),
  getVersionHistory: (id) => api.get(`/documents/${id}/history`),
  rollbackVersion: (id, versionId) =>
    api.post(`/documents/${id}/rollback`, { versionId }),
};

export default api;
