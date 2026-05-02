import { create } from 'zustand';
import { api } from '@/lib/api';

const useNotificationsStore = create((set, get) => ({
  items: [],
  unreadCount: 0,
  isLoading: false,

  fetch: async () => {
    set({ isLoading: true });
    try {
      const { notifications, unreadCount } = await api.get('/api/notifications');
      set({ items: notifications, unreadCount, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  markRead: async (id) => {
    set((s) => ({
      items: s.items.map((n) => n.id === id ? { ...n, isRead: true } : n),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }));
    try {
      await api.patch(`/api/notifications/${id}/read`, {});
    } catch {}
  },

  markAllRead: async () => {
    set((s) => ({
      items: s.items.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
    try {
      await api.patch('/api/notifications/read-all', {});
    } catch {}
  },

  prepend: (notification) => set((s) => ({
    items: [notification, ...s.items.filter((n) => n.id !== notification.id)].slice(0, 50),
    unreadCount: s.unreadCount + (notification.isRead ? 0 : 1),
  })),
}));

export default useNotificationsStore;
