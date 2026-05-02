'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { CAPABILITIES } from '@team-hub/shared';
import PermissionGate from '@/components/ui/PermissionGate';

export default function SettingsLayout({ children }) {
  const { workspaceId } = useParams();
  const pathname = usePathname();
  const base = `/dashboard/${workspaceId}/settings`;
  const tabs = [
    { href: base, label: 'General' },
    { href: `${base}/members`, label: 'Members' },
    { href: `${base}/invitations`, label: 'Invitations' },
    { href: `${base}/audit`, label: 'Audit log', cap: CAPABILITIES.AUDIT_READ },
  ];
  return (
    <div className="max-w-5xl mx-auto p-6">
      {children}
    </div>
  );
}
