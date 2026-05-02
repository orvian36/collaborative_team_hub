'use client';

import { useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import useWorkspaceStore from '@/stores/workspaceStore';
import { startRealtime, stopRealtime } from '@/lib/realtimeBridge';
import useNotificationsStore from '@/stores/notificationsStore';
import usePresenceStore from '@/stores/presenceStore';
import NotificationsBell from '@/components/notifications/NotificationsBell';
import PresenceAvatars from '@/components/presence/PresenceAvatars';
import CommandPalette from '@/components/ui/CommandPalette';

const triggerPalette = () => {
  if (typeof window === 'undefined') return;
  document.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'k', metaKey: true })
  );
};

export default function WorkspaceLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { workspaceId } = useParams();
  const { workspaces, isLoading, setActiveWorkspaceId } = useWorkspaceStore();
  const workspace = workspaces.find((w) => w.id === workspaceId);

  const { fetch: fetchNotifications } = useNotificationsStore();
  const { hydrate: hydratePresence } = usePresenceStore();

  useEffect(() => {
    startRealtime(workspaceId);
    fetchNotifications();
    hydratePresence(workspaceId);
    return () => stopRealtime();
  }, [workspaceId, fetchNotifications, hydratePresence]);

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
      <div className="flex items-center justify-center min-h-[40vh] text-muted">
        <div className="w-7 h-7 rounded-full border-2 border-current border-t-transparent animate-spin" />
      </div>
    );
  }

  const isAdmin = workspace.myRole === 'ADMIN';
  const tabs = [
    { href: `/dashboard/${workspace.id}`, label: 'Home', icon: HomeIcon },
    { href: `/dashboard/${workspace.id}/goals`, label: 'Goals', icon: TargetIcon },
    {
      href: `/dashboard/${workspace.id}/announcements`,
      label: 'Announcements',
      icon: MegaphoneIcon,
    },
    {
      href: `/dashboard/${workspace.id}/action-items`,
      label: 'Action Items',
      icon: ListIcon,
    },
    {
      href: `/dashboard/${workspace.id}/settings/members`,
      label: 'Members',
      icon: UsersIcon,
    },
    isAdmin && {
      href: `/dashboard/${workspace.id}/settings/invitations`,
      label: 'Invitations',
      icon: MailIcon,
    },
    isAdmin && {
      href: `/dashboard/${workspace.id}/settings/audit`,
      label: 'Audit Log',
      icon: ClipboardIcon,
    },
    isAdmin && {
      href: `/dashboard/${workspace.id}/settings`,
      label: 'Settings',
      icon: GearIcon,
    },
  ].filter(Boolean);

  const accent = workspace.accentColor || '#4a3aef';

  return (
    <div className="max-w-7xl mx-auto">
      <section className="relative overflow-hidden rounded-2xl border border-line bg-[color:var(--surface)] mb-5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            background: `radial-gradient(60% 100% at 0% 0%, ${accent}, transparent 60%)`,
          }}
        />
        <div className="relative flex items-center justify-between gap-4 p-5 sm:p-6">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden grid place-items-center text-white font-bold text-lg shrink-0 shadow-lift"
              style={{ backgroundColor: accent }}
            >
              {workspace.iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={workspace.iconUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                (workspace.name[0] || '?').toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.18em] text-subtle font-semibold">
                Workspace
              </p>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-fg truncate">
                {workspace.name}
              </h1>
              {workspace.description && (
                <p className="text-sm text-muted mt-0.5 truncate max-w-xl">
                  {workspace.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={triggerPalette}
              className="hidden md:inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs text-muted hover:text-fg hover:border-line-strong transition-colors bg-[color:var(--surface-2)]"
              title="Open command palette (⌘K)"
            >
              <SearchIcon className="w-3.5 h-3.5" />
              <span>Search</span>
              <kbd className="ml-1 px-1.5 py-0.5 rounded bg-[color:var(--surface-3)] font-mono text-[10px]">
                ⌘K
              </kbd>
            </button>
            <PresenceAvatars />
            <span className="w-px h-6 bg-line hidden sm:block" />
            <NotificationsBell />
          </div>
        </div>
      </section>

      <nav
        className="mb-6 -mx-1 overflow-x-auto"
        aria-label="Workspace sections"
      >
        <ul className="flex gap-1 px-1 border-b border-line min-w-max">
          {tabs.map((t) => {
            const active =
              pathname === t.href ||
              (t.href !== `/dashboard/${workspace.id}` &&
                pathname.startsWith(t.href));
            const Icon = t.icon;
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'text-fg'
                      : 'text-muted hover:text-fg'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-primary-600 dark:bg-primary-400"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {children}
      <CommandPalette />
    </div>
  );
}

function HomeIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M2 7.5 8 2l6 5.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.5z" />
      <path d="M6 15v-4h4v4" />
    </svg>
  );
}
function TargetIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="8" cy="8" r="6" />
      <circle cx="8" cy="8" r="3" />
      <circle cx="8" cy="8" r="0.75" fill="currentColor" />
    </svg>
  );
}
function MegaphoneIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M3 6h3l6-3v10l-6-3H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" />
      <path d="M5 10v2a1 1 0 0 0 1 1h1" />
    </svg>
  );
}
function ListIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M5 4h9M5 8h9M5 12h9" />
      <circle cx="2.5" cy="4" r="0.75" fill="currentColor" />
      <circle cx="2.5" cy="8" r="0.75" fill="currentColor" />
      <circle cx="2.5" cy="12" r="0.75" fill="currentColor" />
    </svg>
  );
}
function UsersIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="6" cy="6" r="2.5" />
      <path d="M2 13c0-2.2 1.8-4 4-4s4 1.8 4 4" />
      <path d="M11 4.5a2 2 0 0 1 0 4M14 13c0-1.7-1-3.2-2.5-3.7" />
    </svg>
  );
}
function MailIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="2" y="3.5" width="12" height="9" rx="1.5" />
      <path d="m3 5 5 4 5-4" />
    </svg>
  );
}
function ClipboardIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="4" y="3" width="8" height="11" rx="1.5" />
      <path d="M6 3V2.5A1.5 1.5 0 0 1 7.5 1h1A1.5 1.5 0 0 1 10 2.5V3" />
      <path d="M6.5 7h3M6.5 10h3" />
    </svg>
  );
}
function GearIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="8" cy="8" r="2.25" />
      <path d="M8 1.5v1.8M8 12.7v1.8M14.5 8h-1.8M3.3 8H1.5M12.6 3.4l-1.3 1.3M4.7 11.3l-1.3 1.3M12.6 12.6l-1.3-1.3M4.7 4.7 3.4 3.4" />
    </svg>
  );
}
function SearchIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="7" cy="7" r="4.5" />
      <path d="m13.5 13.5-3-3" />
    </svg>
  );
}
