'use client';

import { useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import useWorkspaceStore from '@/stores/workspaceStore';

export default function WorkspaceLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { workspaceId } = useParams();
  const { workspaces, isLoading, setActiveWorkspaceId } = useWorkspaceStore();
  const workspace = workspaces.find((w) => w.id === workspaceId);

  useEffect(() => {
    if (!isLoading && workspaces.length > 0 && !workspace) {
      router.replace('/dashboard');
    }
  }, [isLoading, workspaces, workspace, router]);

  useEffect(() => {
    if (workspace) setActiveWorkspaceId(workspace.id);
  }, [workspace, setActiveWorkspaceId]);

  if (!workspace) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const isAdmin = workspace.myRole === 'ADMIN';
  const tabs = [
    { href: `/dashboard/${workspace.id}`, label: 'Home' },
    isAdmin && { href: `/dashboard/${workspace.id}/settings`, label: 'Settings' },
    { href: `/dashboard/${workspace.id}/settings/members`, label: 'Members' },
    isAdmin && { href: `/dashboard/${workspace.id}/settings/invitations`, label: 'Invitations' },
  ].filter(Boolean);

  return (
    <div>
      <header
        className="rounded-lg p-6 mb-6 text-white"
        style={{ backgroundColor: workspace.accentColor }}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-lg overflow-hidden bg-white/20 flex items-center justify-center text-2xl font-bold">
            {workspace.iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={workspace.iconUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              (workspace.name[0] || '?').toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{workspace.name}</h1>
            {workspace.description && (
              <p className="text-sm opacity-90">{workspace.description}</p>
            )}
          </div>
        </div>
      </header>
      <nav className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                active
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
