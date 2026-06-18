import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Inject JWT token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; name?: string; role?: string; shopName?: string }) =>
    api.post('/api/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
};

// ─── Products ─────────────────────────────────────────────────────────────────
export const productsApi = {
  list: (params?: Record<string, string | number>) => api.get('/api/products', { params }),
  get: (id: number) => api.get(`/api/products/${id}`),
  create: (data: FormData) =>
    api.post('/api/products', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: number, data: FormData) =>
    api.put(`/api/products/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: number) => api.delete(`/api/products/${id}`),
  reviews: (id: number) => api.get(`/api/products/${id}/reviews`),
  addReview: (id: number, data: { rating: number; comment?: string }) =>
    api.post(`/api/products/${id}/reviews`, data),
  categories: () => api.get('/api/products/categories/all'),
};

// ─── Cart ─────────────────────────────────────────────────────────────────────
export const cartApi = {
  get: () => api.get('/api/cart'),
  add: (productId: number, quantity?: number) => api.post('/api/cart', { productId, quantity }),
  update: (itemId: number, quantity: number) => api.put(`/api/cart/${itemId}`, { quantity }),
  remove: (itemId: number) => api.delete(`/api/cart/${itemId}`),
};

// ─── Orders ───────────────────────────────────────────────────────────────────
export const ordersApi = {
  checkout: (data: { address: string; paymentMethod?: string; note?: string; items?: { productId: number; quantity: number }[] }) =>
    api.post('/api/orders', data),
  myOrders: () => api.get('/api/orders'),
  get: (id: number) => api.get(`/api/orders/${id}`),
  sellerOrders: () => api.get('/api/orders/seller/list'),
  updateStatus: (id: number, status: string) => api.patch(`/api/orders/${id}/status`, { status }),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  stats: () => api.get('/api/admin/stats'),
  users: (params?: Record<string, string | number>) => api.get('/api/admin/users', { params }),
  updateUserRole: (id: number, role: string) => api.patch(`/api/admin/users/${id}/role`, { role }),
  deleteUser: (id: number) => api.delete(`/api/admin/users/${id}`),
  products: (params?: Record<string, string | number>) => api.get('/api/admin/products', { params }),
  toggleProduct: (id: number) => api.patch(`/api/admin/products/${id}/toggle`),
  orders: (params?: Record<string, string | number>) => api.get('/api/admin/orders', { params }),
  createCategory: (data: { name: string; icon?: string }) => api.post('/api/admin/categories', data),
};
