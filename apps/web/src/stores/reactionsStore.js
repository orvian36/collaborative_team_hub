import { create } from 'zustand';
import { api } from '@/lib/api';

const useReactionsStore = create((set, get) => ({
  byAnnouncementId: {}, // { [id]: Reaction[] }

  setForAnnouncement: (announcementId, reactions) => set((s) => ({
    byAnnouncementId: { ...s.byAnnouncementId, [announcementId]: reactions || [] },
  })),

  toggle: async (workspaceId, announcementId, emoji, currentUserId) => {
    // Optimistic toggle (used in Phase 7 too)
    const list = get().byAnnouncementId[announcementId] || [];
    const existing = list.find((r) => r.userId === currentUserId && r.emoji === emoji);
    if (existing) {
      set((s) => ({
        byAnnouncementId: {
          ...s.byAnnouncementId,
          [announcementId]: list.filter((r) => r.id !== existing.id),
        },
      }));
    } else {
      const tmpId = `tmp-${Date.now()}`;
      set((s) => ({
        byAnnouncementId: {
          ...s.byAnnouncementId,
          [announcementId]: [...list, { id: tmpId, emoji, userId: currentUserId, announcementId }],
        },
      }));
    }
    try {
      const result = await api.post(
        `/api/workspaces/${workspaceId}/announcements/${announcementId}/reactions`,
        { emoji },
      );
      // Reconcile with server result
      set((s) => {
        const cur = (s.byAnnouncementId[announcementId] || []).filter((r) => !String(r.id).startsWith('tmp-'));
        if (result.removed) return { byAnnouncementId: { ...s.byAnnouncementId, [announcementId]: cur } };
        return { byAnnouncementId: { ...s.byAnnouncementId, [announcementId]: [...cur, result.reaction] } };
      });
    } catch (err) {
      // Rollback
      set((s) => ({ byAnnouncementId: { ...s.byAnnouncementId, [announcementId]: list } }));
      throw err;
    }
  },

  upsert: (reaction) => set((s) => {
    const list = s.byAnnouncementId[reaction.announcementId] || [];
    const exists = list.some((r) => r.id === reaction.id);
    return {
      byAnnouncementId: {
        ...s.byAnnouncementId,
        [reaction.announcementId]: exists ? list : [...list, reaction],
      },
    };
  }),
  removeLocal: ({ announcementId, reactionId, userId, emoji }) => set((s) => ({
    byAnnouncementId: {
      ...s.byAnnouncementId,
      [announcementId]: (s.byAnnouncementId[announcementId] || []).filter((r) =>
        reactionId ? r.id !== reactionId : !(r.userId === userId && r.emoji === emoji)),
    },
  })),
}));

export default useReactionsStore;
