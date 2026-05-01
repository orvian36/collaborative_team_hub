import { create } from 'zustand';
import { api } from '../lib/api';

const LAST_ACTIVE_KEY = 'team-hub:lastActiveWorkspaceId';

const useWorkspaceStore = create((set, get) => ({
  workspaces: [],
  activeWorkspaceId: null,
  isLoading: false,
  error: null,

  setActiveWorkspaceId: (id) => {
    set({ activeWorkspaceId: id });
    if (typeof window !== 'undefined' && id) {
      window.localStorage.setItem(LAST_ACTIVE_KEY, id);
    }
  },

  getLastActiveWorkspaceId: () => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(LAST_ACTIVE_KEY);
  },

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.get('/api/workspaces');
      set({ workspaces: data.workspaces || [], isLoading: false });
      return data.workspaces || [];
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return [];
    }
  },

  createWorkspace: async (input) => {
    try {
      const data = await api.post('/api/workspaces', input);
      const ws = data.workspace;
      set((s) => ({ workspaces: [...s.workspaces, ws] }));
      return ws;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  updateWorkspace: async (id, patch) => {
    const data = await api.patch(`/api/workspaces/${id}`, patch);
    const updated = data.workspace;
    set((s) => ({
      workspaces: s.workspaces.map((w) => (w.id === id ? { ...w, ...updated } : w)),
    }));
    return updated;
  },

  uploadWorkspaceIcon: async (id, file) => {
    const fd = new FormData();
    fd.append('icon', file);
    const data = await api.upload(`/api/workspaces/${id}/icon`, fd);
    set((s) => ({
      workspaces: s.workspaces.map((w) => (w.id === id ? { ...w, iconUrl: data.iconUrl } : w)),
    }));
    return data.iconUrl;
  },

  deleteWorkspace: async (id) => {
    await api.delete(`/api/workspaces/${id}`);
    set((s) => {
      const remaining = s.workspaces.filter((w) => w.id !== id);
      const activeRemoved = s.activeWorkspaceId === id;
      return {
        workspaces: remaining,
        activeWorkspaceId: activeRemoved ? null : s.activeWorkspaceId,
      };
    });
    if (typeof window !== 'undefined' && get().getLastActiveWorkspaceId() === id) {
      window.localStorage.removeItem(LAST_ACTIVE_KEY);
    }
  },
}));

export default useWorkspaceStore;
