import { create } from 'zustand';
import { api } from '@/lib/api';

const usePresenceStore = create((set, get) => ({
  onlineUserIds: new Set(),

  hydrate: async (workspaceId) => {
    try {
      const { onlineUserIds } = await api.get(`/api/workspaces/${workspaceId}/presence`);
      set({ onlineUserIds: new Set(onlineUserIds) });
    } catch {}
  },

  setOnline: (userId) => set((s) => {
    if (s.onlineUserIds.has(userId)) return s;
    const next = new Set(s.onlineUserIds);
    next.add(userId);
    return { onlineUserIds: next };
  }),

  setOffline: (userId) => set((s) => {
    if (!s.onlineUserIds.has(userId)) return s;
    const next = new Set(s.onlineUserIds);
    next.delete(userId);
    return { onlineUserIds: next };
  }),

  reset: () => set({ onlineUserIds: new Set() }),
}));

export default usePresenceStore;
