'use client';

import InvitationStatusBadge from './InvitationStatusBadge';
import Button from '../ui/Button';

export default function InvitationList({ invitations, onRevoke, onResend }) {
  if (!invitations.length) {
    return <p className="text-sm text-gray-500">No invitations yet.</p>;
  }
  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
      {invitations.map((inv) => (
        <li key={inv.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-[200px]">
            <div className="font-medium text-gray-900 dark:text-white">{inv.email}</div>
            <div className="text-xs text-gray-500">
              {inv.role} · sent {new Date(inv.createdAt).toLocaleDateString()}
              {inv.status === 'PENDING' && ` · expires ${new Date(inv.expiresAt).toLocaleDateString()}`}
            </div>
          </div>
          <InvitationStatusBadge status={inv.status} />
          {inv.status === 'PENDING' && (
            <>
              <Button variant="secondary" size="sm" onClick={() => onResend(inv.id)}>Resend</Button>
              <Button variant="outline" size="sm" onClick={() => onRevoke(inv.id)}>Revoke</Button>
            </>
          )}
          {inv.status === 'EXPIRED' && (
            <Button variant="secondary" size="sm" onClick={() => onResend(inv.id)}>Resend</Button>
          )}
        </li>
      ))}
    </ul>
  );
}
