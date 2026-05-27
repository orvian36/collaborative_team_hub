'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import useWorkspaceStore from '@/stores/workspaceStore';
import useWorkspaceMembersStore from '@/stores/workspaceMembersStore';
import InviteForm from '@/components/invitations/InviteForm';
import InvitationList from '@/components/invitations/InvitationList';

export default function InvitationsPage() {
  const { workspaceId } = useParams();
  const workspace = useWorkspaceStore((s) =>
    s.workspaces.find((w) => w.id === workspaceId)
  );
  const {
    invitations,
    fetchInvitations,
    inviteMember,
    revokeInvitation,
    resendInvitation,
  } = useWorkspaceMembersStore();

  useEffect(() => {
    if (workspaceId) fetchInvitations(workspaceId);
  }, [workspaceId, fetchInvitations]);

  if (!workspace) return null;
  if (workspace.myRole !== 'ADMIN') {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <p className="text-gray-600 dark:text-gray-300">
          Only admins can manage invitations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Invite a teammate
        </h2>
        <InviteForm onInvite={(input) => inviteMember(workspaceId, input)} />
      </section>
      <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Pending &amp; past invitations
        </h2>
        <InvitationList
          invitations={invitations}
          onRevoke={(id) => revokeInvitation(workspaceId, id)}
          onResend={(id) => resendInvitation(workspaceId, id)}
        />
      </section>
    </div>
  );
}
