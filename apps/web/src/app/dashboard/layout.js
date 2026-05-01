'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/stores/authStore';
import useWorkspaceStore from '@/stores/workspaceStore';
import WorkspaceRail from '@/components/workspace/WorkspaceRail';
import Button from '@/components/ui/Button';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { user, isAuthenticated, isCheckingAuth, checkAuth, logout } = useAuthStore();
  const { fetchWorkspaces } = useWorkspaceStore();

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
              <span className="text-xl font-bold text-primary-600">Team Hub</span>
              <div className="flex items-center gap-3">
                <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-300">
                  {user?.name}
                </span>
                <Button variant="secondary" size="sm" onClick={() => logout()}>Logout</Button>
              </div>
            </div>
          </div>
        </nav>
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
