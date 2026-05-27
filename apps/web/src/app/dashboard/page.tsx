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
    <div className="flex items-center justify-center min-h-[40vh] text-muted">
      <div className="flex flex-col items-center gap-3">
        <div className="w-7 h-7 rounded-full border-2 border-current border-t-transparent animate-spin" />
        <span className="text-sm">Picking the right workspace</span>
      </div>
    </div>
  );
}
