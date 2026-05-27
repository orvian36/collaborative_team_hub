// Zustand auth store — manages user session state
// TODO: Implement login, logout, register, refreshToken actions

import { create } from 'zustand';
import { api } from '../lib/api';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isCheckingAuth: true,
  error: null,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
      isCheckingAuth: false,
      error: null,
    }),
  clearUser: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isCheckingAuth: false,
      error: null,
    }),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const data = await api.post('/api/auth/login', { email, password });
      set({ user: data.user, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  register: async (name, email, password) => {
    try {
      set({ isLoading: true, error: null });
      const data = await api.post('/api/auth/register', {
        name,
        email,
        password,
      });
      set({ user: data.user, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      await api.post('/api/auth/logout');
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateProfile: async ({ name, avatarFile }) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      if (name) formData.append('name', name);
      if (avatarFile) formData.append('avatar', avatarFile);
      const res = await api.upload('/api/auth/me', formData, { method: 'PUT' });
      set({ user: res.user, isLoading: false });
      return { success: true, user: res.user };
    } catch (err) {
      set({ isLoading: false, error: err.message });
      return { success: false, error: err.message };
    }
  },

  checkAuth: async () => {
    try {
      set({ isCheckingAuth: true, error: null });
      const data = await api.get('/api/auth/me');
      set({ user: data.user, isAuthenticated: true, isCheckingAuth: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isCheckingAuth: false });
    }
  },
}));

export default useAuthStore;
