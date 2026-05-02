import { create } from 'zustand';
import { api } from '@/lib/api';

const useCommentsStore = create((set, get) => ({
  byAnnouncementId: {}, // { [id]: Comment[] }

  fetchFor: async (workspaceId, announcementId) => {
    const { comments } = await api.get(`/api/workspaces/${workspaceId}/announcements/${announcementId}/comments`);
    set((s) => ({ byAnnouncementId: { ...s.byAnnouncementId, [announcementId]: comments } }));
  },
  add: async (workspaceId, announcementId, content) => {
    const { comment } = await api.post(
      `/api/workspaces/${workspaceId}/announcements/${announcementId}/comments`,
      { content },
    );
    set((s) => ({
      byAnnouncementId: {
        ...s.byAnnouncementId,
        [announcementId]: [...(s.byAnnouncementId[announcementId] || []), comment],
      },
    }));
    return comment;
  },
  remove: async (workspaceId, announcementId, commentId) => {
    await api.delete(`/api/workspaces/${workspaceId}/announcements/${announcementId}/comments/${commentId}`);
    set((s) => ({
      byAnnouncementId: {
        ...s.byAnnouncementId,
        [announcementId]: (s.byAnnouncementId[announcementId] || []).filter((c) => c.id !== commentId),
      },
    }));
  },

  // Real-time
  upsert: (comment) => set((s) => {
    const list = s.byAnnouncementId[comment.announcementId] || [];
    const exists = list.some((c) => c.id === comment.id);
    return {
      byAnnouncementId: {
        ...s.byAnnouncementId,
        [comment.announcementId]: exists
          ? list.map((c) => c.id === comment.id ? comment : c)
          : [...list, comment],
      },
    };
  }),
  removeLocal: (announcementId, commentId) => set((s) => ({
    byAnnouncementId: {
      ...s.byAnnouncementId,
      [announcementId]: (s.byAnnouncementId[announcementId] || []).filter((c) => c.id !== commentId),
    },
  })),
}));

export default useCommentsStore;
