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
    { href: base,                   label: 'General' },
    { href: `${base}/members`,      label: 'Members' },
    { href: `${base}/invitations`,  label: 'Invitations' },
    { href: `${base}/audit`,        label: 'Audit log', cap: CAPABILITIES.AUDIT_READ },
  ];
  return (
    <div className="max-w-5xl mx-auto p-6">
      <nav className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
        {tabs.map((t) => {
          const active = pathname === t.href;
          const link = (
            <Link
              key={t.href}
              href={t.href}
              className={`px-4 py-2 text-sm border-b-2 -mb-px ${
                active
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t.label}
            </Link>
          );
          return t.cap ? <PermissionGate key={t.href} cap={t.cap}>{link}</PermissionGate> : link;
        })}
      </nav>
      {children}
    </div>
  );
}
