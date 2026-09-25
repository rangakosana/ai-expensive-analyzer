import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
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

// Response interceptor: Handle 401 unauthorized gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API methods
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

export const expenseService = {
  getExpenses: (params) => api.get('/expenses', { params }),
  getExpenseSummary: (month) => api.get('/expenses/summary', { params: { month } }),
  getExpenseById: (id) => api.get(`/expenses/${id}`),
  createExpense: (expenseData) => api.post('/expenses', expenseData),
  updateExpense: (id, expenseData) => api.put(`/expenses/${id}`, expenseData),
  deleteExpense: (id) => api.delete(`/expenses/${id}`),
  scanReceipt: (data) => api.post('/expenses/scan-receipt', data, { timeout: 15000 }),
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
