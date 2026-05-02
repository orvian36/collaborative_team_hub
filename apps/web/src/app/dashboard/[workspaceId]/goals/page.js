'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CAPABILITIES } from '@team-hub/shared';
import useGoalsStore from '@/stores/goalsStore';
import { useCapability } from '@/hooks/useCapability';
import GoalCard from '@/components/goals/GoalCard';
import GoalFormModal from '@/components/goals/GoalFormModal';
import Button from '@/components/ui/Button';

export default function GoalsPage() {
  const { workspaceId } = useParams();
  const { goals, isLoading, fetchGoals, createGoal } = useGoalsStore();
  const canCreate = useCapability(CAPABILITIES.GOAL_CREATE);
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchGoals(workspaceId);
  }, [workspaceId, fetchGoals]);

  useEffect(() => {
    if (searchParams.get('new') === '1') setOpen(true);
  }, [searchParams]);

  const filtered = goals.filter(
    (g) => statusFilter === 'ALL' || g.status === statusFilter
  );

  const counts = goals.reduce(
    (acc, g) => {
      acc.ALL += 1;
      acc[g.status] = (acc[g.status] || 0) + 1;
      return acc;
    },
    { ALL: 0 }
  );

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-subtle font-semibold">
            What we&apos;re working toward
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-fg mt-1">
            Goals
          </h1>
        </div>
        {canCreate && (
          <Button variant="contrast" onClick={() => setOpen(true)}>
            New goal
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6 border-b border-line pb-4">
        {[
          { key: 'ALL', label: 'All' },
          { key: 'NOT_STARTED', label: 'Not started' },
          { key: 'IN_PROGRESS', label: 'In progress' },
          { key: 'COMPLETED', label: 'Completed' },
        ].map((s) => {
          const active = statusFilter === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full transition-colors ${
                active
                  ? 'bg-[color:var(--fg)] text-[color:var(--bg)]'
                  : 'text-muted hover:text-fg hover:bg-[color:var(--surface-2)]'
              }`}
            >
              {s.label}
              <span
                className={`text-[10px] font-mono px-1.5 rounded-full ${
                  active
                    ? 'bg-white/15'
                    : 'bg-[color:var(--surface-3)] text-subtle'
                }`}
              >
                {counts[s.key] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-44 rounded-xl border border-line bg-[color:var(--surface-2)]"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          canCreate={canCreate}
          onCreate={() => setOpen(true)}
          filter={statusFilter}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((g) => (
            <GoalCard key={g.id} goal={g} workspaceId={workspaceId} />
          ))}
        </div>
      )}

      <GoalFormModal
        open={open}
        onClose={() => setOpen(false)}
        workspaceId={workspaceId}
        onSubmit={(data) => createGoal(workspaceId, data)}
      />
    </div>
  );
}

function EmptyState({ canCreate, onCreate, filter }) {
  const filtered = filter !== 'ALL';
  return (
    <div className="rounded-2xl border border-dashed border-line bg-[color:var(--surface)] py-16 px-6 text-center">
      <div className="mx-auto w-12 h-12 rounded-2xl bg-[color:var(--surface-2)] grid place-items-center mb-4 text-primary-600 dark:text-primary-300">
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
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold tracking-tight">
        {filtered ? 'Nothing in this view' : 'No goals yet'}
      </h2>
      <p className="mt-1.5 text-sm text-muted max-w-sm mx-auto">
        {filtered
          ? 'Switch the filter or create a goal to populate it.'
          : 'Goals are the backbone of the workspace. Add one to start tracking momentum.'}
      </p>
      {canCreate && (
        <div className="mt-6">
          <Button variant="contrast" onClick={onCreate}>
            Create the first goal
          </Button>
        </div>
      )}
    </div>
  );
}
