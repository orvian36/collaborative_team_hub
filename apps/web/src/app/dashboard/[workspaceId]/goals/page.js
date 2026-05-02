'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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

  useEffect(() => {
    fetchGoals(workspaceId);
  }, [workspaceId, fetchGoals]);

  const filtered = goals.filter((g) => statusFilter === 'ALL' || g.status === statusFilter);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Goals</h1>
        {canCreate && <Button onClick={() => setOpen(true)}>New goal</Button>}
      </div>

      <div className="flex gap-2 mb-6">
        {['ALL', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'].map((s) => (
          <button key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 text-sm rounded-full border ${statusFilter === s
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'}`}>
            {s === 'ALL' ? 'All' : s.replace('_', ' ').toLowerCase()}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading goals…</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500">No goals yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((g) => <GoalCard key={g.id} goal={g} workspaceId={workspaceId} />)}
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
