'use client';

import { useState } from 'react';
import RoleBadge from './RoleBadge';
import RoleSelect from './RoleSelect';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';

export default function MemberList({
  members,
  currentUserId,
  isAdmin,
  onChangeRole,
  onRemove,
}) {
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const target = members.find((m) => m.id === confirmRemoveId);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {members.map((m) => {
          const isSelf = m.userId === currentUserId;
          return (
            <li
              key={m.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-semibold text-gray-700 dark:text-gray-200">
                  {((m.user?.name || m.name || '?')[0]).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {m.user?.name || m.name}{' '}
                    {isSelf && (
                      <span className="text-xs text-gray-500">(you)</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {m.user?.email || m.email}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isAdmin ? (
                  <RoleSelect
                    value={m.role}
                    onChange={(r) => onChangeRole(m.id, r)}
                  />
                ) : (
                  <RoleBadge role={m.role} />
                )}
                {(isAdmin || isSelf) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmRemoveId(m.id)}
                  >
                    {isSelf ? 'Leave' : 'Remove'}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <ConfirmDialog
        open={!!target}
        onClose={() => setConfirmRemoveId(null)}
        onConfirm={async () => {
          await onRemove(target.id);
          setConfirmRemoveId(null);
        }}
        title={
          target?.userId === currentUserId
            ? 'Leave workspace?'
            : 'Remove member?'
        }
        message={
          target?.userId === currentUserId
            ? 'You will lose access to this workspace immediately.'
            : `Remove ${target?.user?.name || target?.name} from this workspace?`
        }
        confirmLabel={target?.userId === currentUserId ? 'Leave' : 'Remove'}
      />
    </div>
  );
}
