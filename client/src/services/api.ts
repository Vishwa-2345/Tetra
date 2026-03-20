import axios from 'axios';

const API_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: { email: string; password: string; name: string; role?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
};

export const usersAPI = {
  list: (params?: { skill?: string; min_rating?: number; verified_only?: boolean }) =>
    api.get('/users', { params }),
  getNearby: (params: { latitude: number; longitude: number; radius_km?: number }) =>
    api.get('/users/nearby', { params }),
  getById: (id: number) => api.get(`/users/${id}`),
  updateProfile: (data: any) => api.put('/users/profile', data),
  getProfileCompletion: () => api.get('/users/profile-completion'),
  getDashboardStats: () => api.get('/users/me/dashboard'),
};

export const jobsAPI = {
  create: (data: { title: string; description: string; skill_required?: string; price: number }) =>
    api.post('/jobs', data),
  list: (params?: { status?: string; skill?: string; min_price?: number; max_price?: number }) =>
    api.get('/jobs', { params }),
  getById: (id: number) => api.get(`/jobs/${id}`),
  update: (id: number, data: any) => api.put(`/jobs/${id}`, data),
  updateStatus: (id: number, status: string) => api.put(`/jobs/${id}/status`, { status }),
  assign: (id: number, job_doer_id: number) => api.put(`/jobs/${id}/assign`, { job_doer_id }),
  getMyJobs: () => api.get('/jobs/my-jobs'),
  getAssignedJobs: () => api.get('/jobs/assigned-jobs'),
};

export const paymentsAPI = {
  payAdvance: (job_id: number) => api.post('/payments/advance', { job_id, amount: 0, transaction_type: 'advance' }),
  requestRefund: (job_id: number) => api.post('/payments/refund', { job_id, amount: 0, transaction_type: 'refund' }),
  payFinal: (job_id: number) => api.post('/payments/final', { job_id, amount: 0, transaction_type: 'final' }),
  getWallet: () => api.get('/payments/wallet'),
  getTransactions: (job_id?: number) => api.get('/payments/transactions', { params: { job_id } }),
};

export const reviewsAPI = {
  create: (data: { job_id: number; reviewee_id: number; rating: number; feedback?: string }) =>
    api.post('/reviews', data),
  getByUser: (userId: number) => api.get(`/reviews/${userId}`),
  getByJob: (jobId: number) => api.get(`/reviews/job/${jobId}`),
};

export const messagesAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (userId: number, skip?: number, limit?: number) =>
    api.get(`/messages/${userId}`, { params: { skip, limit } }),
  send: (data: { receiver_id: number; content: string; job_id?: number }) =>
    api.post('/messages', data),
};

export const notificationsAPI = {
  list: (unreadOnly?: boolean) => api.get('/notifications', { params: { unread_only: unreadOnly } }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params?: { role?: string; verified?: boolean; suspended?: boolean }) =>
    api.get('/admin/users', { params }),
  verifyUser: (id: number) => api.put(`/admin/users/${id}/verify`),
  suspendUser: (id: number, suspend: boolean) => api.put(`/admin/users/${id}/suspend`, null, { params: { suspend } }),
  getJobs: (status?: string) => api.get('/admin/jobs', { params: { status } }),
  getTransactions: (type?: string) => api.get('/admin/transactions', { params: { transaction_type: type } }),
};

export default api;
