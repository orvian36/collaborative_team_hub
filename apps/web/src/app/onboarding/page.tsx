'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/stores/authStore';
import useWorkspaceStore from '@/stores/workspaceStore';
import CreateWorkspaceModal from '@/components/workspace/CreateWorkspaceModal';
import LogoMark from '@/components/brand/LogoMark';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, isCheckingAuth, checkAuth, user } = useAuthStore();
  const { workspaces, fetchWorkspaces, createWorkspace } = useWorkspaceStore();
  const [open, setOpen] = useState(false);

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
    <div className="min-h-screen bg-app text-fg flex flex-col">
      <header className="px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <LogoMark className="w-7 h-7" />
          <span className="font-semibold tracking-tight">Team Hub</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 grid place-items-center px-5 sm:px-8 py-12">
        <div className="w-full max-w-xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-[color:var(--surface)] px-3.5 py-1 text-xs text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse-soft" />
            One step left
          </span>

          <h1 className="mt-6 font-display text-display-xl font-extrabold tracking-tight text-balance">
            Welcome
            {user?.name ? `, ${user.name.split(' ')[0]}` : ''}.
            <br />
            <span className="serif-italic font-normal text-primary-600 dark:text-primary-300">
              Let&apos;s name your workspace.
            </span>
          </h1>

          <p className="mt-5 text-muted text-pretty">
            A workspace is where your team&apos;s goals, announcements, and
            action items live. You can create more later, and switch in two
            clicks.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="group inline-flex items-center gap-2 rounded-full bg-[color:var(--fg)] text-[color:var(--bg)] pl-5 pr-2 py-2 text-sm font-semibold shadow-lift hover:shadow-glow-primary transition-all"
            >
              Create your first workspace
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-500 text-white group-hover:translate-x-0.5 transition-transform">
                <svg
                  viewBox="0 0 16 16"
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M3 8h10" />
                  <path d="m9 4 4 4-4 4" />
                </svg>
              </span>
            </button>
          </div>

          <ul className="mt-12 grid sm:grid-cols-3 gap-px bg-line border border-line rounded-2xl overflow-hidden text-left">
            {[
              {
                t: 'Pick a name',
                b: 'Use your team or project name. You can change it anytime.',
              },
              {
                t: 'Choose an accent',
                b: 'A color helps you spot the right workspace at a glance.',
              },
              {
                t: 'Invite your team',
                b: 'Send a link. Roles default sensibly. Promote later as needed.',
              },
            ].map((s, i) => (
              <li
                key={s.t}
                className="bg-[color:var(--surface)] p-5"
              >
                <span className="font-mono text-[11px] tracking-widest text-primary-600 dark:text-primary-300">
                  0{i + 1}
                </span>
                <h3 className="mt-1 font-semibold tracking-tight text-sm">
                  {s.t}
                </h3>
                <p className="mt-1 text-xs text-muted leading-relaxed">{s.b}</p>
              </li>
            ))}
          </ul>
        </div>

        <CreateWorkspaceModal
          open={open}
          onClose={() => setOpen(false)}
          onCreate={async (data) => {
            const ws = await createWorkspace(data);
            router.push(`/dashboard/${ws.id}`);
          }}
        />
      </main>
    </div>
  );
}
