import { create } from 'zustand';
import { api } from '@/lib/api';

const useGoalsStore = create((set, get) => ({
  goals: [],
  currentGoal: null,
  isLoading: false,
  error: null,

  fetchGoals: async (workspaceId) => {
    set({ isLoading: true, error: null });
    try {
      const { goals } = await api.get(`/api/workspaces/${workspaceId}/goals`);
      set({ goals, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchGoal: async (workspaceId, goalId) => {
    set({ isLoading: true, error: null });
    try {
      const { goal } = await api.get(
        `/api/workspaces/${workspaceId}/goals/${goalId}`
      );
      set({ currentGoal: goal, isLoading: false });
      return goal;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  createGoal: async (workspaceId, payload) => {
    const { goal } = await api.post(
      `/api/workspaces/${workspaceId}/goals`,
      payload
    );
    set((s) => {
      if (s.goals.some((g) => g.id === goal.id)) return s;
      return { goals: [goal, ...s.goals] };
    });
    return goal;
  },

  updateGoal: async (workspaceId, goalId, payload) => {
    const { goal } = await api.put(
      `/api/workspaces/${workspaceId}/goals/${goalId}`,
      payload
    );
    set((s) => ({
      goals: s.goals.map((g) => (g.id === goalId ? goal : g)),
      currentGoal: s.currentGoal?.id === goalId ? goal : s.currentGoal,
    }));
    return goal;
  },

  changeStatus: async (workspaceId, goalId, status) => {
    const { goal } = await api.patch(
      `/api/workspaces/${workspaceId}/goals/${goalId}/status`,
      { status }
    );
    set((s) => ({
      goals: s.goals.map((g) =>
        g.id === goalId ? { ...g, status: goal.status } : g
      ),
      currentGoal:
        s.currentGoal?.id === goalId
          ? { ...s.currentGoal, status: goal.status }
          : s.currentGoal,
    }));
    return goal;
  },

  deleteGoal: async (workspaceId, goalId) => {
    await api.delete(`/api/workspaces/${workspaceId}/goals/${goalId}`);
    set((s) => ({
      goals: s.goals.filter((g) => g.id !== goalId),
      currentGoal: s.currentGoal?.id === goalId ? null : s.currentGoal,
    }));
  },

  // Real-time hooks (Phase 5 wires these in)
  upsertGoal: (goal) =>
    set((s) => {
      const exists = s.goals.some((g) => g.id === goal.id);
      return {
        goals: exists
          ? s.goals.map((g) => (g.id === goal.id ? goal : g))
          : [goal, ...s.goals],
        currentGoal:
          s.currentGoal?.id === goal.id
            ? { ...s.currentGoal, ...goal }
            : s.currentGoal,
      };
    }),
  removeGoal: (goalId) =>
    set((s) => ({
      goals: s.goals.filter((g) => g.id !== goalId),
      currentGoal: s.currentGoal?.id === goalId ? null : s.currentGoal,
    })),
  patchGoal: (goalId, patch) =>
    set((s) => ({
      goals: s.goals.map((g) => (g.id === goalId ? { ...g, ...patch } : g)),
      currentGoal:
        s.currentGoal?.id === goalId
          ? { ...s.currentGoal, ...patch }
          : s.currentGoal,
    })),
}));

export default useGoalsStore;
