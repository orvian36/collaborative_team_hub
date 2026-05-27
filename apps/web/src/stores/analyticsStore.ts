import { create } from 'zustand';
import { api } from '@/lib/api';

const useAnalyticsStore = create((set) => ({
  stats: null,
  isLoading: false,

  fetch: async (workspaceId) => {
    set({ isLoading: true });
    try {
      const stats = await api.get(`/api/workspaces/${workspaceId}/stats`);
      set({ stats, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
}));

export default useAnalyticsStore;
