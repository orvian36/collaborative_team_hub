'use client';

import { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import useAnalyticsStore from '@/stores/analyticsStore';
import useGoalsStore from '@/stores/goalsStore';
import useAuthStore from '@/stores/authStore';
import StatsTiles from '@/components/analytics/StatsTiles';
import GoalCompletionChart from '@/components/analytics/GoalCompletionChart';
import ExportButtons from '@/components/analytics/ExportButtons';
import StatusPill from '@/components/goals/StatusPill';

export default function DashboardHome() {
  const { workspaceId } = useParams();
  const { stats, isLoading, fetch } = useAnalyticsStore();
  const { goals, fetchGoals } = useGoalsStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetch(workspaceId);
    fetchGoals(workspaceId);
  }, [workspaceId, fetch, fetchGoals]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 5) return 'Working late';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    if (h < 22) return 'Good evening';
    return 'Working late';
  }, []);

  const inFlight = (goals || [])
    .filter((g) => g.status === 'IN_PROGRESS')
    .slice(0, 4);
  const recentlyCompleted = (goals || [])
    .filter((g) => g.status === 'COMPLETED')
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-subtle font-semibold">
            Overview
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-fg mt-1">
            {greeting},{' '}
            <span className="serif-italic font-normal text-primary-600 dark:text-primary-300">
              {user?.name?.split(' ')[0] || 'there'}
            </span>
            .
          </h1>
        </div>
        <ExportButtons />
      </div>

      {isLoading || !stats ? (
        <SkeletonHome />
      ) : (
        <>
          <StatsTiles stats={stats} />

          <div className="grid lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7">
              <GoalCompletionChart data={stats.goalCompletionByMonth} />
            </div>

            <div className="lg:col-span-5 space-y-5">
              <Panel
                title="In flight"
                hint={`${inFlight.length} goal${inFlight.length === 1 ? '' : 's'}`}
                emptyText="Nothing in progress yet."
                items={inFlight}
                workspaceId={workspaceId}
              />
              <Panel
                title="Just shipped"
                hint={`${recentlyCompleted.length} goal${recentlyCompleted.length === 1 ? '' : 's'}`}
                emptyText="No completed goals yet."
                items={recentlyCompleted}
                workspaceId={workspaceId}
                muted
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Panel({ title, hint, items, emptyText, workspaceId, muted }) {
  return (
    <section className="rounded-2xl border border-line bg-[color:var(--surface)] overflow-hidden">
      <header className="flex items-center justify-between px-5 py-3 border-b border-line">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        <span className="text-[11px] uppercase tracking-wider text-subtle font-mono">
          {hint}
        </span>
      </header>
      {items.length === 0 ? (
        <div className="px-5 py-8 text-sm text-muted text-center">
          {emptyText}
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((g) => (
            <li key={g.id}>
              <Link
                href={`/dashboard/${workspaceId}/goals/${g.id}`}
                className={`block px-5 py-3 hover:bg-[color:var(--surface-2)] transition-colors ${muted ? 'opacity-90' : ''}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-fg text-sm tracking-tight truncate">
                    {g.title}
                  </span>
                  <StatusPill status={g.status} />
                </div>
                {g.owner?.name && (
                  <p className="text-xs text-subtle mt-0.5">{g.owner.name}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SkeletonHome() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-32 rounded-2xl bg-[color:var(--surface-2)] border border-line" />
      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 h-72 rounded-2xl bg-[color:var(--surface-2)] border border-line" />
        <div className="lg:col-span-5 space-y-5">
          <div className="h-44 rounded-2xl bg-[color:var(--surface-2)] border border-line" />
          <div className="h-32 rounded-2xl bg-[color:var(--surface-2)] border border-line" />
        </div>
      </div>
    </div>
  );
}
