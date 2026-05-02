'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/stores/authStore';
import useWorkspaceStore from '@/stores/workspaceStore';
import WorkspaceRail from '@/components/workspace/WorkspaceRail';
import Button from '@/components/ui/Button';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { user, isAuthenticated, isCheckingAuth, checkAuth, logout } =
    useAuthStore();
  const { fetchWorkspaces, activeWorkspaceId } = useWorkspaceStore();

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <WorkspaceRail />
      <div className="flex-1 flex flex-col">
        <nav className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <span className="text-xl font-bold text-primary-600">
                Team Hub
              </span>
              <div className="flex items-center gap-3">
                {activeWorkspaceId ? (
                  <Link
                    href={`/dashboard/${activeWorkspaceId}/profile`}
                    className="hidden sm:flex items-center gap-2 hover:opacity-80"
                  >
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt="avatar"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                        {(user?.name?.[0] || '?').toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {user?.name}
                    </span>
                  </Link>
                ) : (
                  <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200">
                    {user?.name}
                  </span>
                )}
                <Button variant="secondary" size="sm" onClick={() => logout()}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </nav>
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
