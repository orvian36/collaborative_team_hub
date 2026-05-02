'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/stores/authStore';
import useWorkspaceStore from '@/stores/workspaceStore';
import WorkspaceRail from '@/components/workspace/WorkspaceRail';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { user, isAuthenticated, isCheckingAuth, checkAuth, logout } =
    useAuthStore();
  const { fetchWorkspaces, activeWorkspaceId } = useWorkspaceStore();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isCheckingAuth && !isAuthenticated) {
      router.push('/login');
    }
  }, [isCheckingAuth, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) fetchWorkspaces();
  }, [isAuthenticated, fetchWorkspaces]);

  if (isCheckingAuth || (!isAuthenticated && !isCheckingAuth)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app">
        <div className="flex flex-col items-center gap-3 text-muted">
          <div className="w-8 h-8 rounded-full border-2 border-current border-t-transparent animate-spin" />
          <span className="text-sm">Signing you in</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-app">
      <WorkspaceRail />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-[color:var(--bg)]/85 backdrop-blur-md border-b border-line">
          <div className="flex items-center justify-between gap-4 px-4 sm:px-6 h-14">
            <div className="flex items-center gap-2 min-w-0">
              <span className="hidden sm:inline-flex font-semibold tracking-tight text-[15px]">
                Team Hub
              </span>
              <span className="hidden sm:inline-flex text-subtle">/</span>
              <span className="text-sm text-muted truncate">
                {activeWorkspaceId ? 'Workspace' : 'All workspaces'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <ThemeToggle />

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-[color:var(--surface-2)] transition-colors focus-ring"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  {user?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-primary-600 text-white grid place-items-center text-xs font-semibold">
                      {(user?.name?.[0] || '?').toUpperCase()}
                    </span>
                  )}
                  <span className="hidden sm:inline text-sm font-medium max-w-[140px] truncate">
                    {user?.name}
                  </span>
                  <svg
                    viewBox="0 0 16 16"
                    className="w-3.5 h-3.5 text-subtle"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="m4 6 4 4 4-4" />
                  </svg>
                </button>

                {menuOpen && (
                  <>
                    <div
                      aria-hidden
                      className="fixed inset-0 z-30"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div
                      role="menu"
                      className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-line bg-[color:var(--surface)] shadow-lift overflow-hidden z-40 animate-fade-in"
                    >
                      <div className="px-4 py-3 border-b border-line">
                        <p className="text-sm font-medium truncate">
                          {user?.name}
                        </p>
                        <p className="text-xs text-subtle truncate">
                          {user?.email}
                        </p>
                      </div>
                      <div className="py-1">
                        {activeWorkspaceId && (
                          <Link
                            href={`/dashboard/${activeWorkspaceId}/profile`}
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-[color:var(--surface-2)] transition-colors"
                            role="menuitem"
                          >
                            <UserIcon className="w-4 h-4 text-subtle" />
                            Profile
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                          role="menuitem"
                        >
                          <LogoutIcon className="w-4 h-4" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">{children}</main>
      </div>
    </div>
  );
}

function UserIcon({ className = '' }) {
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
      <circle cx="8" cy="6" r="2.5" />
      <path d="M3 13.5c0-2.5 2.2-4 5-4s5 1.5 5 4" />
    </svg>
  );
}

function LogoutIcon({ className = '' }) {
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
      <path d="M9 4V3a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2v-1" />
      <path d="m12 6 2 2-2 2" />
      <path d="M14 8H6" />
    </svg>
  );
}
