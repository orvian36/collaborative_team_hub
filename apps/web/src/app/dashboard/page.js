'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useWorkspaceStore from '@/stores/workspaceStore';

export default function DashboardPage() {
  const router = useRouter();
  const { workspaces, isLoading, getLastActiveWorkspaceId } =
    useWorkspaceStore();

  useEffect(() => {
    if (isLoading) return;

    if (workspaces.length === 0) {
      router.replace('/onboarding');
      return;
    }

    const lastId = getLastActiveWorkspaceId();
    const target = workspaces.find((w) => w.id === lastId) || workspaces[0];
    router.replace(`/dashboard/${target.id}`);
  }, [isLoading, workspaces, router, getLastActiveWorkspaceId]);

  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  );
}
