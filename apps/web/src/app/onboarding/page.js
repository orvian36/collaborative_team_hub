'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/stores/authStore';
import useWorkspaceStore from '@/stores/workspaceStore';
import CreateWorkspaceModal from '@/components/workspace/CreateWorkspaceModal';
import Button from '@/components/ui/Button';

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, isCheckingAuth, checkAuth } = useAuthStore();
  const { workspaces, fetchWorkspaces, createWorkspace } = useWorkspaceStore();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isCheckingAuth && !isAuthenticated) router.push('/login');
  }, [isCheckingAuth, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) fetchWorkspaces();
  }, [isAuthenticated, fetchWorkspaces]);

  useEffect(() => {
    if (workspaces.length > 0) router.replace(`/dashboard/${workspaces[0].id}`);
  }, [workspaces, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to Team Hub
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          You don&apos;t have any workspaces yet. Create one to start
          collaborating.
        </p>
        <Button onClick={() => setOpen(true)}>
          Create your first workspace
        </Button>
        <CreateWorkspaceModal
          open={open}
          onClose={() => setOpen(false)}
          onCreate={async (data) => {
            const ws = await createWorkspace(data);
            router.push(`/dashboard/${ws.id}`);
          }}
        />
      </div>
    </div>
  );
}
