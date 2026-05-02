import { create } from 'zustand';
import { api } from '@/lib/api';
import { ACTION_ITEM_STATUS } from '@team-hub/shared';

const EMPTY_BUCKETS = () => ({
  [ACTION_ITEM_STATUS.TODO]: [],
  [ACTION_ITEM_STATUS.IN_PROGRESS]: [],
  [ACTION_ITEM_STATUS.DONE]: [],
});

const useActionItemsStore = create((set, get) => ({
  byStatus: EMPTY_BUCKETS(),
  isLoading: false,

  fetchAll: async (workspaceId) => {
    set({ isLoading: true });
    try {
      const { actionItems } = await api.get(
        `/api/workspaces/${workspaceId}/action-items`
      );
      const buckets = EMPTY_BUCKETS();
      for (const item of actionItems) {
        if (!buckets[item.status]) buckets[item.status] = [];
        buckets[item.status].push(item);
      }
      for (const k of Object.keys(buckets)) {
        buckets[k].sort((a, b) => a.position - b.position);
      }
      set({ byStatus: buckets, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  create: async (workspaceId, payload) => {
    const { actionItem } = await api.post(
      `/api/workspaces/${workspaceId}/action-items`,
      payload
    );
    set((s) => {
      const bucket = s.byStatus[actionItem.status] || [];
      if (bucket.some((it) => it.id === actionItem.id)) return s;
      return {
        byStatus: {
          ...s.byStatus,
          [actionItem.status]: [...bucket, actionItem].sort(
            (a, b) => a.position - b.position
          ),
        },
      };
    });
    return actionItem;
  },

  update: async (workspaceId, id, payload) => {
    const { actionItem } = await api.put(
      `/api/workspaces/${workspaceId}/action-items/${id}`,
      payload
    );
    set((s) => {
      const buckets = { ...s.byStatus };
      for (const k of Object.keys(buckets)) {
        buckets[k] = buckets[k].map((it) => (it.id === id ? actionItem : it));
      }
      return { byStatus: buckets };
    });
    return actionItem;
  },

  remove: async (workspaceId, id) => {
    await api.delete(`/api/workspaces/${workspaceId}/action-items/${id}`);
    set((s) => {
      const buckets = { ...s.byStatus };
      for (const k of Object.keys(buckets)) {
        buckets[k] = buckets[k].filter((it) => it.id !== id);
      }
      return { byStatus: buckets };
    });
  },

  /** Optimistic move: update locally then call API; rollback on error. */
  move: async (workspaceId, id, toStatus, toPosition) => {
    const before = get().byStatus;
    let item = null;
    let fromStatus = null;
    for (const k of Object.keys(before)) {
      const found = before[k].find((it) => it.id === id);
      if (found) {
        item = found;
        fromStatus = k;
        break;
      }
    }
    if (!item) return;

    // Build new buckets locally
    const next = {};
    for (const k of Object.keys(before)) next[k] = [...before[k]];
    next[fromStatus] = next[fromStatus].filter((it) => it.id !== id);
    next[toStatus] = [...next[toStatus]];
    const moved = { ...item, status: toStatus, position: toPosition };
    next[toStatus].splice(toPosition, 0, moved);
    // Recompute positions for both columns
    next[fromStatus] = next[fromStatus].map((it, i) => ({
      ...it,
      position: i,
    }));
    next[toStatus] = next[toStatus].map((it, i) => ({ ...it, position: i }));
    set({ byStatus: next });

    try {
      const { actionItem } = await api.patch(
        `/api/workspaces/${workspaceId}/action-items/${id}/move`,
        {
          status: toStatus,
          position: toPosition,
        }
      );
      // Reconcile with authoritative copy
      set((s) => {
        const buckets = { ...s.byStatus };
        for (const k of Object.keys(buckets)) {
          buckets[k] = buckets[k].map((it) => (it.id === id ? actionItem : it));
        }
        return { byStatus: buckets };
      });
    } catch (err) {
      // Rollback
      set({ byStatus: before });
      throw err;
    }
  },

  // Real-time
  upsert: (item) =>
    set((s) => {
      const buckets = { ...s.byStatus };
      for (const k of Object.keys(buckets)) {
        buckets[k] = buckets[k].filter((it) => it.id !== item.id);
      }
      buckets[item.status] = [...(buckets[item.status] || []), item].sort(
        (a, b) => a.position - b.position
      );
      return { byStatus: buckets };
    }),
  removeLocal: (id) =>
    set((s) => {
      const buckets = { ...s.byStatus };
      for (const k of Object.keys(buckets)) {
        buckets[k] = buckets[k].filter((it) => it.id !== id);
      }
      return { byStatus: buckets };
    }),
}));

export default useActionItemsStore;
