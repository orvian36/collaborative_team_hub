'use client';

import { useParams } from 'next/navigation';
import useWorkspaceStore from '@/stores/workspaceStore';

export default function WorkspaceHome() {
  const { workspaceId } = useParams();
  const workspace = useWorkspaceStore((s) => s.workspaces.find((w) => w.id === workspaceId));

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {workspace?.name || 'Workspace'}
      </h2>
      <p className="text-gray-600 dark:text-gray-300">
        Goals, announcements, and action items will live here in upcoming milestones.
        Use the tabs above to manage members and invitations.
      </p>
    </div>
  );
}
