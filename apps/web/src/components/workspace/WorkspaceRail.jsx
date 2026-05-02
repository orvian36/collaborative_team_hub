'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import LogoMark from '../brand/LogoMark';
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
    <aside
      className="hidden sm:flex sticky top-0 h-screen flex-col items-center gap-2 py-4 w-[68px] bg-ink-950 dark:bg-black/60 border-r border-ink-800 dark:border-ink-900 z-30"
      aria-label="Workspace switcher"
    >
      <Link
        href="/"
        className="mb-2 group"
        title="Team Hub home"
      >
        <span className="block transition-transform group-hover:scale-105">
          <LogoMark className="w-9 h-9" />
        </span>
      </Link>
      <span className="w-8 h-px bg-ink-800 mb-1" aria-hidden />

      <div className="flex-1 w-full flex flex-col items-center gap-2 overflow-y-auto px-2 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
          className="mt-1 w-11 h-11 rounded-2xl bg-ink-800/70 hover:bg-primary-600 hover:rounded-xl text-ink-200 hover:text-white grid place-items-center transition-all duration-200"
          title="Create workspace"
          aria-label="Create workspace"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

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
