import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 with concurrency-safe silent refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only intercept 401 errors on requests that have not been retried yet
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const url = originalRequest.url || '';

      // Skip refresh attempt on auth endpoints (login, register, refresh, logout)
      if (
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/refresh') ||
        url.includes('/auth/logout')
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue concurrent requests while a refresh is in-flight
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await api.post('/auth/refresh');
        const newToken = refreshResponse.data.token;

        localStorage.setItem('token', newToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        processQueue(null, newToken);

        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);

        localStorage.removeItem('token');
        localStorage.removeItem('user');

        const currentPath = window.location.pathname;
        const isPublicPath =
          currentPath === '/login' ||
          currentPath === '/register' ||
          currentPath === '/' ||
          currentPath === '/welcome' ||
          currentPath === '/landing';

        if (!isPublicPath) {
          window.location.href = '/login';
        }

        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// API methods
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  refreshToken: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

export const expenseService = {
  getExpenses: (params) => api.get('/expenses', { params }),
  getExpenseSummary: (month) => api.get('/expenses/summary', { params: { month } }),
  getExpenseById: (id) => api.get(`/expenses/${id}`),
  createExpense: (expenseData) => api.post('/expenses', expenseData),
  createBatchExpenses: (expenses) => api.post('/expenses/batch', { expenses }),
  updateExpense: (id, expenseData) => api.put(`/expenses/${id}`, expenseData),
  deleteExpense: (id) => api.delete(`/expenses/${id}`),
  scanReceipt: (data) => api.post('/expenses/scan-receipt', data, { timeout: 20000 }),
};

export const insightService = {
  getInsights: () => api.get('/insights'),
  getInsightByMonth: (month) => api.get(`/insights/${month}`),
  generateInsight: (month) => api.post('/insights/generate', { month }),
  chatWithAdvisor: (data) => api.post('/insights/chat', data),
};

export const budgetService = {
  getBudget: () => api.get('/budget'),
  saveBudget: (budgetData) => api.post('/budget', budgetData),
};

export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  getUserExpenses: (userId) => api.get(`/admin/users/${userId}/expenses`),
  updateUserRole: (userId, role) => api.patch(`/admin/users/${userId}/role`, { role }),
  resetUserPassword: (userId, newPassword) => api.post(`/admin/users/${userId}/reset-password`, { newPassword }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
};

export default api;
