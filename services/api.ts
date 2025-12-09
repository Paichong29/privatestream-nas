import { MediaFile, FileType, User, SystemStats, LogEntry, Notification } from '../types';

// --- CONFIGURATION ---
const API_BASE = '';

// --- HELPER ---
const getHeaders = (multipart = false) => {
  const token = localStorage.getItem('auth_token');
  const headers: any = {
    'Authorization': token ? `Bearer ${token}` : ''
  };
  if (!multipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

// --- API INTERFACE ---

export const api = {
  getToken: () => localStorage.getItem('auth_token'),

  // 1. AUTH & USERS
  login: async (email: string, password: string): Promise<User> => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    const data = await res.json();
    if (data.token) localStorage.setItem('auth_token', data.token);
    return data.user;
  },

  logout: () => {
    localStorage.removeItem('auth_token');
  },

  changePassword: async (userId: string, oldPass: string, newPass: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/api/auth/change-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userId, oldPassword: oldPass, newPassword: newPass })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to change password');
    }
  },

  forgotPassword: async (email: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (!res.ok) throw new Error('Request failed');
  },

  resetPasswordConfirm: async (email: string, token: string, newPass: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/api/auth/reset-password-confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token, newPassword: newPass })
    });

    if (!res.ok) throw new Error('Reset failed');
  },

  getUsers: async (): Promise<User[]> => {
    const res = await fetch(`${API_BASE}/api/users`, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  createUser: async (userData: any): Promise<void> => {
    const res = await fetch(`${API_BASE}/api/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    if (!res.ok) throw new Error('Failed to create user');
  },

  deleteUser: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/api/users/${id}`, { method: 'DELETE', headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to delete user');
  },

  // 2. FILES CRUD
  getFiles: async (): Promise<MediaFile[]> => {
    const res = await fetch(`${API_BASE}/api/files`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch files');
    return res.json();
  },

  uploadFile: async (file: File): Promise<MediaFile> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },

  deleteFile: async (id: string): Promise<void> => {
    await fetch(`${API_BASE}/api/files/${id}`, { method: 'DELETE', headers: getHeaders() });
  },

  renameFile: async (id: string, newName: string): Promise<void> => {
    await fetch(`${API_BASE}/api/files/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ name: newName })
    });
  },

  toggleStorageLocation: async (id: string): Promise<MediaFile> => {
    const res = await fetch(`${API_BASE}/api/files/${id}/tier`, { method: 'POST', headers: getHeaders() });
    return res.json();
  },

  downloadFile: (id: string) => {
    const token = localStorage.getItem('auth_token');
    window.open(`${API_BASE}/api/files/${id}/download?token=${token}`, '_blank');
  },

  // 3. SETTINGS & STATS
  getSettings: async (): Promise<any> => {
    const res = await fetch(`${API_BASE}/api/settings`, { headers: getHeaders() });
    if (res.ok) return res.json();
    return {};
  },

  updateSettings: async (settings: any): Promise<void> => {
    await fetch(`${API_BASE}/api/settings`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(settings)
    });
  },

  getStats: async (): Promise<SystemStats> => {
    try {
      const res = await fetch(`${API_BASE}/api/stats`, { headers: getHeaders() });
      if (res.ok) return res.json();
    } catch (e) { }
    return {
      cpuUsage: 0, cpuModel: 'Loading...', ramUsage: 0, ramTotal: 0,
      storageLocalUsed: 0, storageLocalTotal: 0,
      storageCloudUsed: 0, storageCloudTotal: 0, uptime: 0
    };
  },

  getLogs: async (): Promise<LogEntry[]> => {
    try {
      const res = await fetch(`${API_BASE}/api/logs`, { headers: getHeaders() });
      if (res.ok) return res.json();
    } catch (e) { }
    return [];
  },

  getNotifications: async (): Promise<Notification[]> => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    } catch (e) {
      return [];
    }
  },

  markNotificationRead: async (id: string): Promise<void> => {
    await fetch(`${API_BASE}/api/notifications/${id}/read`, { method: 'PATCH', headers: getHeaders() });
  }
};