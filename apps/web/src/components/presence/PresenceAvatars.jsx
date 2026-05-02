'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import usePresenceStore from '@/stores/presenceStore';
import useWorkspaceMembersStore from '@/stores/workspaceMembersStore';

export default function PresenceAvatars({ max = 5 }) {
  const { workspaceId } = useParams();
  const onlineUserIds = usePresenceStore((s) => s.onlineUserIds);
  const { members, fetchMembers } = useWorkspaceMembersStore();

  useEffect(() => {
    if (members.length === 0 && workspaceId) fetchMembers(workspaceId);
  }, [workspaceId, members.length, fetchMembers]);

  const onlineMembers = members.filter(
    (m) => m.user && onlineUserIds.has(m.user.id)
  );
  const visible = onlineMembers.slice(0, max);
  const overflow = onlineMembers.length - visible.length;

  if (onlineMembers.length === 0) return null;

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((m) =>
        m.user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={m.id}
            src={m.user.avatarUrl}
            alt={m.user.name}
            title={`${m.user.name} (online)`}
            className="w-7 h-7 rounded-full ring-2 ring-white dark:ring-gray-800 ring-offset-1 ring-offset-green-500"
          />
        ) : (
          <div
            key={m.id}
            title={`${m.user.name} (online)`}
            className="w-7 h-7 rounded-full bg-gray-300 ring-2 ring-white dark:ring-gray-800 ring-offset-1 ring-offset-green-500 flex items-center justify-center text-xs font-medium text-gray-700"
          >
            {(m.user.name || '?')[0].toUpperCase()}
          </div>
        )
      )}
      {overflow > 0 && (
        <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 ring-2 ring-white dark:ring-gray-800 flex items-center justify-center text-xs text-gray-700">
          +{overflow}
        </div>
      )}
    </div>
  );
}
