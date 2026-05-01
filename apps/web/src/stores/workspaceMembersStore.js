import { create } from 'zustand';
import { api } from '../lib/api';

const useWorkspaceMembersStore = create((set, get) => ({
  members: [],
  invitations: [],
  isLoading: false,
  error: null,

  fetchMembers: async (workspaceId) => {
    const data = await api.get(`/api/workspaces/${workspaceId}/members`);
    set({ members: data.members || [] });
    return data.members || [];
  },

  fetchInvitations: async (workspaceId) => {
    const data = await api.get(`/api/workspaces/${workspaceId}/invitations`);
    set({ invitations: data.invitations || [] });
    return data.invitations || [];
  },

  inviteMember: async (workspaceId, { email, role }) => {
    const data = await api.post(`/api/workspaces/${workspaceId}/invitations`, { email, role });
    set((s) => ({ invitations: [data.invitation, ...s.invitations] }));
    return data;
  },

  revokeInvitation: async (workspaceId, invitationId) => {
    await api.delete(`/api/workspaces/${workspaceId}/invitations/${invitationId}`);
    set((s) => ({
      invitations: s.invitations.map((i) =>
        i.id === invitationId ? { ...i, status: 'REVOKED' } : i
      ),
    }));
  },

  resendInvitation: async (workspaceId, invitationId) => {
    const data = await api.post(`/api/workspaces/${workspaceId}/invitations/${invitationId}/resend`, {});
    set((s) => ({
      invitations: s.invitations.map((i) =>
        i.id === invitationId ? data.invitation : i
      ),
    }));
    return data;
  },

  updateMemberRole: async (workspaceId, memberId, role) => {
    const data = await api.patch(`/api/workspaces/${workspaceId}/members/${memberId}`, { role });
    set((s) => ({
      members: s.members.map((m) => (m.id === memberId ? { ...m, role: data.member.role } : m)),
    }));
    return data.member;
  },

  removeMember: async (workspaceId, memberId) => {
    await api.delete(`/api/workspaces/${workspaceId}/members/${memberId}`);
    set((s) => ({ members: s.members.filter((m) => m.id !== memberId) }));
  },

  leaveWorkspace: async (workspaceId) => {
    await api.post(`/api/workspaces/${workspaceId}/members/leave`, {});
  },
}));

export default useWorkspaceMembersStore;
