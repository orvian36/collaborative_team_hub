import { create } from 'zustand';
import { api } from '@/lib/api';

const useMilestonesStore = create((set, get) => ({
  byGoalId: {}, // { [goalId]: Milestone[] }
  isLoading: false,

  fetchForGoal: async (workspaceId, goalId) => {
    set({ isLoading: true });
    try {
      const { milestones } = await api.get(
        `/api/workspaces/${workspaceId}/goals/${goalId}/milestones`
      );
      set((s) => ({
        byGoalId: { ...s.byGoalId, [goalId]: milestones },
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  create: async (workspaceId, goalId, payload) => {
    const { milestone } = await api.post(
      `/api/workspaces/${workspaceId}/goals/${goalId}/milestones`,
      payload
    );
    set((s) => {
      const list = s.byGoalId[goalId] || [];
      if (list.some((m) => m.id === milestone.id)) return s;
      return {
        byGoalId: {
          ...s.byGoalId,
          [goalId]: [...list, milestone],
        },
      };
    });
    return milestone;
  },

  update: async (workspaceId, goalId, milestoneId, payload) => {
    const { milestone } = await api.put(
      `/api/workspaces/${workspaceId}/goals/${goalId}/milestones/${milestoneId}`,
      payload
    );
    set((s) => ({
      byGoalId: {
        ...s.byGoalId,
        [goalId]: (s.byGoalId[goalId] || []).map((m) =>
          m.id === milestoneId ? milestone : m
        ),
      },
    }));
    return milestone;
  },

  remove: async (workspaceId, goalId, milestoneId) => {
    await api.delete(
      `/api/workspaces/${workspaceId}/goals/${goalId}/milestones/${milestoneId}`
    );
    set((s) => ({
      byGoalId: {
        ...s.byGoalId,
        [goalId]: (s.byGoalId[goalId] || []).filter(
          (m) => m.id !== milestoneId
        ),
      },
    }));
  },

  // Real-time
  upsert: (milestone) =>
    set((s) => {
      const list = s.byGoalId[milestone.goalId] || [];
      const exists = list.some((m) => m.id === milestone.id);
      return {
        byGoalId: {
          ...s.byGoalId,
          [milestone.goalId]: exists
            ? list.map((m) => (m.id === milestone.id ? milestone : m))
            : [...list, milestone],
        },
      };
    }),
  removeLocal: (goalId, milestoneId) =>
    set((s) => ({
      byGoalId: {
        ...s.byGoalId,
        [goalId]: (s.byGoalId[goalId] || []).filter(
          (m) => m.id !== milestoneId
        ),
      },
    })),
}));

export default useMilestonesStore;
