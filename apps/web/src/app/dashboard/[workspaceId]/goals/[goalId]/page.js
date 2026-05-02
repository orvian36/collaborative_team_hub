'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { GOAL_STATUS, CAPABILITIES } from '@team-hub/shared';
import useGoalsStore from '@/stores/goalsStore';
import useMilestonesStore from '@/stores/milestonesStore';
import StatusPill from '@/components/goals/StatusPill';
import MilestoneList from '@/components/goals/MilestoneList';
import GoalActivityFeed from '@/components/goals/GoalActivityFeed';
import GoalFormModal from '@/components/goals/GoalFormModal';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useCapability } from '@/hooks/useCapability';

export default function GoalDetailPage() {
  const router = useRouter();
  const { workspaceId, goalId } = useParams();
  const { currentGoal, fetchGoal, updateGoal, changeStatus, deleteGoal } =
    useGoalsStore();
  const ms = useMilestonesStore();
  const milestones = ms.byGoalId[goalId] || [];
  const canEdit = useCapability(CAPABILITIES.GOAL_EDIT);
  const canDelete = useCapability(CAPABILITIES.GOAL_DELETE);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    fetchGoal(workspaceId, goalId).catch(() =>
      router.push(`/dashboard/${workspaceId}/goals`)
    );
    ms.fetchForGoal(workspaceId, goalId);
  }, [workspaceId, goalId, fetchGoal, ms, router]);

  if (!currentGoal)
    return (
      <div className="p-6">
        <p className="text-gray-500">Loading…</p>
      </div>
    );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Link
        href={`/dashboard/${workspaceId}/goals`}
        className="text-sm text-primary-600 hover:underline"
      >
        ← All goals
      </Link>

      <header className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {currentGoal.title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <StatusPill status={currentGoal.status} />
            {currentGoal.owner && <span>Owner: {currentGoal.owner.name}</span>}
            {currentGoal.dueDate && (
              <span>
                Due {new Date(currentGoal.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
          {currentGoal.description && (
            <p className="mt-3 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {currentGoal.description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <select
              value={currentGoal.status}
              onChange={(e) =>
                changeStatus(workspaceId, goalId, e.target.value)
              }
              className="text-sm px-2 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900 dark:text-white"
            >
              <option value={GOAL_STATUS.NOT_STARTED}>Not started</option>
              <option value={GOAL_STATUS.IN_PROGRESS}>In progress</option>
              <option value={GOAL_STATUS.COMPLETED}>Completed</option>
            </select>
          )}
          {canEdit && (
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="outline" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          )}
        </div>
      </header>

      <section>
        <MilestoneList
          milestones={milestones}
          onCreate={(p) => ms.create(workspaceId, goalId, p)}
          onUpdate={(id, p) => ms.update(workspaceId, goalId, id, p)}
          onRemove={(id) => ms.remove(workspaceId, goalId, id)}
        />
      </section>

      <section>
        <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
          Activity
        </h2>
        <GoalActivityFeed goalId={goalId} />
      </section>

      <GoalFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        workspaceId={workspaceId}
        initial={currentGoal}
        onSubmit={(data) => updateGoal(workspaceId, goalId, data)}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete this goal?"
        description="This will remove all milestones and activity. This cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await deleteGoal(workspaceId, goalId);
          router.push(`/dashboard/${workspaceId}/goals`);
        }}
      />
    </div>
  );
}
