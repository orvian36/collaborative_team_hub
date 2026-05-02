import { create } from 'zustand';
import { api } from '@/lib/api';

const useAnnouncementsStore = create((set, get) => ({
  announcements: [],
  current: null,
  isLoading: false,

  fetchAll: async (workspaceId) => {
    set({ isLoading: true });
    try {
      const { announcements } = await api.get(
        `/api/workspaces/${workspaceId}/announcements`
      );
      set({ announcements, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },
  fetchOne: async (workspaceId, id) => {
    const { announcement } = await api.get(
      `/api/workspaces/${workspaceId}/announcements/${id}`
    );
    set({ current: announcement });
    return announcement;
  },
  create: async (workspaceId, payload) => {
    const { announcement } = await api.post(
      `/api/workspaces/${workspaceId}/announcements`,
      payload
    );
    set((s) => {
      if (s.announcements.some((a) => a.id === announcement.id)) return s;
      return { announcements: [announcement, ...s.announcements] };
    });
    return announcement;
  },
  update: async (workspaceId, id, payload) => {
    const { announcement } = await api.put(
      `/api/workspaces/${workspaceId}/announcements/${id}`,
      payload
    );
    set((s) => ({
      announcements: s.announcements.map((a) =>
        a.id === id ? announcement : a
      ),
      current: s.current?.id === id ? announcement : s.current,
    }));
    return announcement;
  },
  remove: async (workspaceId, id) => {
    await api.delete(`/api/workspaces/${workspaceId}/announcements/${id}`);
    set((s) => ({
      announcements: s.announcements.filter((a) => a.id !== id),
      current: s.current?.id === id ? null : s.current,
    }));
  },
  togglePin: async (workspaceId, id) => {
    const { announcement } = await api.patch(
      `/api/workspaces/${workspaceId}/announcements/${id}/pin`,
      {}
    );
    set((s) => ({
      announcements: sortAnnouncements(
        s.announcements.map((a) => (a.id === id ? announcement : a))
      ),
      current: s.current?.id === id ? announcement : s.current,
    }));
    return announcement;
  },

  // Real-time hooks
  upsert: (a) =>
    set((s) => {
      const exists = s.announcements.some((x) => x.id === a.id);
      return {
        announcements: sortAnnouncements(
          exists
            ? s.announcements.map((x) => (x.id === a.id ? a : x))
            : [a, ...s.announcements]
        ),
      };
    }),
  removeLocal: (id) =>
    set((s) => ({
      announcements: s.announcements.filter((a) => a.id !== id),
      current: s.current?.id === id ? null : s.current,
    })),
}));

function sortAnnouncements(list) {
  return [...list].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    if (a.isPinned && b.isPinned) {
      return new Date(b.pinnedAt || 0) - new Date(a.pinnedAt || 0);
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

export default useAnnouncementsStore;
