import { create } from 'zustand';
import { api } from '@/lib/api';

const useAuditStore = create((set, get) => ({
  events: [],
  page: 1,
  totalPages: 1,
  isLoading: false,
  filters: { type: '', actorId: '', from: '', to: '' },

  setFilters: (patch) =>
    set((s) => ({ filters: { ...s.filters, ...patch }, page: 1 })),

  fetch: async (workspaceId, page = 1) => {
    set({ isLoading: true });
    try {
      const f = get().filters;
      const params = new URLSearchParams({ page: String(page) });
      if (f.type) params.set('type', f.type);
      if (f.actorId) params.set('actorId', f.actorId);
      if (f.from) params.set('from', f.from);
      if (f.to) params.set('to', f.to);
      const data = await api.get(
        `/api/workspaces/${workspaceId}/audit?${params.toString()}`
      );
      set({
        events: data.events,
        page: data.page,
        totalPages: data.totalPages,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  // Real-time
  prepend: (activity) =>
    set((s) => {
      if (s.page !== 1) return s;
      return { events: [activity, ...s.events].slice(0, 50) };
    }),
}));

export default useAuditStore;
