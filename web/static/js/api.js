// API Configuration
const API_BASE_URL = 'http://localhost:8080/api';

// Token management
const TokenManager = {
    getToken: () => localStorage.getItem('token'),
    setToken: (token) => localStorage.setItem('token', token),
    removeToken: () => localStorage.removeItem('token'),
    getUser: () => JSON.parse(localStorage.getItem('user') || '{}'),
    setUser: (user) => localStorage.setItem('user', JSON.stringify(user)),
    removeUser: () => localStorage.removeItem('user'),
};

// API Request helper
async function apiRequest(endpoint, options = {}) {
    const token = TokenManager.getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        // Unauthorized - redirect to login
        TokenManager.removeToken();
        TokenManager.removeUser();
        window.location.href = '/login';
        return null;
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }

    return data;
}

// Auth API
const AuthAPI = {
    login: async (username, password) => {
        const response = await apiRequest('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });

        if (response) {
            TokenManager.setToken(response.token);
            TokenManager.setUser(response.user);
        }

        return response;
    },
    logout: () => {
        TokenManager.removeToken();
        TokenManager.removeUser();
        window.location.href = '/login';
    },
    getProfile: async () => {
        return await apiRequest('/profile');
    },
};

// Complaint API
const ComplaintAPI = {
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(`/complaints?${queryString}`);
    },
    getById: async (id) => {
        return await apiRequest(`/complaints/${id}`);
    },
    create: async (formData) => {
        return await fetch(`${API_BASE_URL}/complaints`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TokenManager.getToken()}`,
            },
            body: formData,
        }).then(res => res.json());
    },
    update: async (id, data) => {
        return await apiRequest(`/complaints/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
    delete: async (id) => {
        return await apiRequest(`/complaints/${id}`, {
            method: 'DELETE',
        });
    },
    getStats: async () => {
        return await apiRequest('/complaints/stats');
    },
};

// Category API
const CategoryAPI = {
    getAll: async () => {
        return await apiRequest('/categories');
    },
};

// User API
const UserAPI = {
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(`/users?${queryString}`);
    },
    getStats: async () => {
        return await apiRequest('/users/stats');
    },
    create: async (userData) => {
        return await apiRequest('/users', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },
};

// Report API
const ReportAPI = {
    getStats: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(`/reports/stats?${queryString}`);
    },
    getCategories: async () => {
        return await apiRequest('/reports/categories');
    },
    getTrends: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(`/reports/trends?${queryString}`);
    },
};

// Announcement API
const AnnouncementAPI = {
    getAll: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.status) queryParams.append('status', params.status);
        if (params.search) queryParams.append('search', params.search);

        const query = queryParams.toString();
        return await apiRequest(`/announcements${query ? '?' + query : ''}`);
    },

    getById: async (id) => {
        return await apiRequest(`/announcements/${id}`);
    },

    create: async (data) => {
        return await apiRequest('/announcements', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update: async (id, data) => {
        return await apiRequest(`/announcements/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete: async (id) => {
        return await apiRequest(`/announcements/${id}`, {
            method: 'DELETE',
        });
    },
};

// Notification API
const NotificationAPI = {
    getAll: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.limit) queryParams.append('limit', params.limit);
        const query = queryParams.toString();
        return await apiRequest(`/notifications${query ? '?' + query : ''}`);
    },
    markAsRead: async (id) => {
        return await apiRequest(`/notifications/${id}/read`, {
            method: 'PUT',
        });
    },
    markAllAsRead: async () => {
        return await apiRequest('/notifications/read-all', {
            method: 'PUT',
        });
    },
};

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getStatusBadgeClass(status) {
    const statusMap = {
        'pending': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
        'in_process': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        'completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        'rejected': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };
    return statusMap[status] || statusMap.pending;
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Pending',
        'in_process': 'In Process',
        'completed': 'Completed',
        'rejected': 'Rejected',
    };
    return statusMap[status] || status;
}

// Theme Management
const ThemeManager = {
    getTheme: () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme;
        }
        // Default to light mode
        return 'light';
    },

    setTheme: (theme) => {
        localStorage.setItem('theme', theme);
        const html = document.documentElement;
        if (theme === 'dark') {
            html.classList.remove('light');
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
            html.classList.add('light');
        }
    },

    toggle: () => {
        const currentTheme = ThemeManager.getTheme();
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        ThemeManager.setTheme(newTheme);
        return newTheme;
    },

    init: () => {
        const theme = ThemeManager.getTheme();
        ThemeManager.setTheme(theme);
    }
};

