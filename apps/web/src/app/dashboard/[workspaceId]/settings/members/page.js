'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useAuthStore from '@/stores/authStore';
import useWorkspaceStore from '@/stores/workspaceStore';
import useWorkspaceMembersStore from '@/stores/workspaceMembersStore';
import MemberList from '@/components/members/MemberList';

export default function MembersPage() {
  const router = useRouter();
  const { workspaceId } = useParams();
  const { user } = useAuthStore();
  const workspace = useWorkspaceStore((s) => s.workspaces.find((w) => w.id === workspaceId));
  const fetchWorkspaces = useWorkspaceStore((s) => s.fetchWorkspaces);
  const { members, fetchMembers, updateMemberRole, removeMember, leaveWorkspace } = useWorkspaceMembersStore();

  useEffect(() => {
    if (workspaceId) fetchMembers(workspaceId);
  }, [workspaceId, fetchMembers]);

  if (!workspace) return null;

  const isAdmin = workspace.myRole === 'ADMIN';

  const handleChangeRole = async (memberId, role) => {
    await updateMemberRole(workspaceId, memberId, role);
  };

  const handleRemove = async (memberId) => {
    const target = members.find((m) => m.id === memberId);
    const isSelf = target?.userId === user?.id;
    if (isSelf) {
      await leaveWorkspace(workspaceId);
      await fetchWorkspaces();
      router.replace('/dashboard');
    } else {
      await removeMember(workspaceId, memberId);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Members ({members.length})
      </h2>
      <MemberList
        members={members}
        currentUserId={user?.id}
        isAdmin={isAdmin}
        onChangeRole={handleChangeRole}
        onRemove={handleRemove}
      />
    </div>
  );
}
