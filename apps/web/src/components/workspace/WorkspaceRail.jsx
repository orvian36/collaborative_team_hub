'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useWorkspaceStore from '../../stores/workspaceStore';
import WorkspaceTile from './WorkspaceTile';
import CreateWorkspaceModal from './CreateWorkspaceModal';

export default function WorkspaceRail() {
  const router = useRouter();
  const params = useParams();
  const activeId = params?.workspaceId;
  const { workspaces, createWorkspace } = useWorkspaceStore();
  const [creating, setCreating] = useState(false);

  return (
    <aside className="flex flex-col items-center gap-3 py-4 w-20 bg-gray-900 text-white min-h-screen">
      <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">
        Hubs
      </div>
      {workspaces.map((w) => (
        <WorkspaceTile
          key={w.id}
          workspace={w}
          isActive={w.id === activeId}
          href={`/dashboard/${w.id}`}
        />
      ))}
      <button
        type="button"
        onClick={() => setCreating(true)}
        className="w-12 h-12 rounded-lg bg-gray-700 hover:bg-gray-600 text-2xl text-gray-200 flex items-center justify-center transition-colors"
        title="Create workspace"
      >
        +
      </button>
      <CreateWorkspaceModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={async (data) => {
          const ws = await createWorkspace(data);
          setCreating(false);
          router.push(`/dashboard/${ws.id}`);
        }}
      />
    </aside>
  );
}
