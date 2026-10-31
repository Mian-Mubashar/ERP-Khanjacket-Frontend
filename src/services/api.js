/**
 * Khan Clothes Warehouse API Client
 * Connects Frontend seamlessly to Node.js/Express/Sequelize SQL Backend
 */

/**
 * Dynamically resolves Backend API Base URL from environment variables
 * If user provides 'https://api.khanjackethouse.com' or 'https://api.khanjackethouse.com/api/v1',
 * this automatically handles trailing slashes and ensures /api/v1 suffix.
 */
const getBaseUrl = () => {
  let url = (import.meta.env?.VITE_API_BASE_URL || '').trim();

  // Smart fallback: When browsing on localhost, use local backend on port 5000
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost && (!url || url.includes('api.khanjackethouse.com'))) {
      return 'http://localhost:5000/api/v1';
    }
  }

  if (!url) {
    url = 'http://localhost:5000/api/v1';
  }

  url = url.replace(/\/+$/, '');
  if (!url.endsWith('/api/v1')) {
    url = `${url}/api/v1`;
  }
  return url;
};

// Token Management
export const getAuthToken = () => localStorage.getItem('kc_auth_token');
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('kc_auth_token', token);
  } else {
    localStorage.removeItem('kc_auth_token');
  }
};

/**
 * Universal HTTP Request Helper
 */
const request = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  const url = `${getBaseUrl()}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        setAuthToken(null);
        localStorage.removeItem('kc_user');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('kc:unauthorized'));
        }
      }
      const errorMsg = data?.message || `HTTP Error ${response.status}: ${response.statusText}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, error.message);
    throw error;
  }
};

// ==========================================
// API Modules
// ==========================================

export const api = {
  // Authentication & RBAC
  auth: {
    login: async (email, password) => {
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (res.data?.token) {
        setAuthToken(res.data.token);
      }
      return res;
    },
    getMe: () => request('/auth/me'),
    switchRole: async (role) => {
      const res = await request('/auth/switch-role', {
        method: 'POST',
        body: JSON.stringify({ role })
      });
      if (res.data?.token) {
        setAuthToken(res.data.token);
      }
      return res;
    },
    logout: () => setAuthToken(null)
  },

  // Articles & Inventory
  articles: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/articles${query ? `?${query}` : ''}`);
    },
    getByNo: (articleNo) => request(`/articles/${articleNo}`),
    create: (data) => request('/articles', { method: 'POST', body: JSON.stringify(data) }),
    update: (articleNo, data) => request(`/articles/${articleNo}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (articleNo) => request(`/articles/${articleNo}`, { method: 'DELETE' })
  },

  // China Import Purchases
  purchases: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/purchases${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/purchases/${id}`),
    create: (data) => request('/purchases', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/purchases/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/purchases/${id}`, { method: 'DELETE' })
  },

  // Warehouse Outward Dispatches
  outward: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/outward${query ? `?${query}` : ''}`);
    },
    create: (data) => request('/outward', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/outward/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/outward/${id}`, { method: 'DELETE' })
  },

  // Suppliers & Vendor Ledgers
  suppliers: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/suppliers${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/suppliers/${id}`),
    create: (data) => request('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/suppliers/${id}`, { method: 'DELETE' }),
    recordPayment: (data) => request('/payments/supplier', { method: 'POST', body: JSON.stringify(data) }),
    updatePayment: (id, data) => request(`/payments/supplier/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deletePayment: (id) => request(`/payments/supplier/${id}`, { method: 'DELETE' }),
    listPayments: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/payments/supplier${query ? `?${query}` : ''}`);
    }
  },

  // Wholesale Customers & Shopkeeper Khatas
  customers: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/customers${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/customers/${id}`),
    create: (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/customers/${id}`, { method: 'DELETE' }),
    recordPayment: (data) => request('/payments/customer', { method: 'POST', body: JSON.stringify(data) }),
    updatePayment: (id, data) => request(`/payments/customer/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deletePayment: (id) => request(`/payments/customer/${id}`, { method: 'DELETE' }),
    listPayments: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/payments/customer${query ? `?${query}` : ''}`);
    }
  },

  // Branches / Destination Cities
  cities: {
    list: () => request('/cities'),
    create: (data) => request('/cities', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/cities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/cities/${id}`, { method: 'DELETE' })
  },

  // Fabrics & Categories
  stuffs: {
    list: () => request('/stuffs'),
    create: (name) => request('/stuffs', { method: 'POST', body: JSON.stringify({ name }) }),
    listCategories: () => request('/stuffs/categories'),
    createCategory: (name) => request('/stuffs/categories', { method: 'POST', body: JSON.stringify({ name }) }),
    updateCategory: (name, newName) => request(`/stuffs/categories/${encodeURIComponent(name)}`, { method: 'PUT', body: JSON.stringify({ newName }) }),
    deleteCategory: (name) => request(`/stuffs/categories/${encodeURIComponent(name)}`, { method: 'DELETE' })
  },

  // Warehouse Racks & Godowns
  locations: {
    list: () => request('/locations'),
    create: (name) => request('/locations', { method: 'POST', body: JSON.stringify({ name }) }),
    delete: (name) => request(`/locations/${name}`, { method: 'DELETE' })
  },

  // Authorized Mobile Hardware Devices (4-5 Devices Policy)
  devices: {
    list: () => request('/devices'),
    create: (data) => request('/devices', { method: 'POST', body: JSON.stringify(data) }),
    toggle: (id) => request(`/devices/${id}/toggle`, { method: 'PATCH' }),
    delete: (id) => request(`/devices/${id}`, { method: 'DELETE' })
  },

  // Audit Trail & Logs
  audit: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/audit${query ? `?${query}` : ''}`);
    }
  },

  // Executive Reports & Metrics
  reports: {
    dashboard: () => request('/reports/dashboard')
  },

  // Database Backup Snapshot
  backup: {
    export: () => request('/backup/export')
  },

  // Health
  health: () => request('/health')
};

export default api;
