import Link from 'next/link';
import StatusPill from './StatusPill';

export default function GoalCard({ goal, workspaceId }) {
  const completed =
    goal.milestones?.filter((m) => m.progress === 100).length || 0;
  const total = goal.milestones?.length || 0;

  return (
    <Link
      href={`/dashboard/${workspaceId}/goals/${goal.id}`}
      className="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
          {goal.title}
        </h3>
        <StatusPill status={goal.status} />
      </div>
      {goal.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
          {goal.description}
        </p>
      )}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          {goal.owner?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={goal.owner.avatarUrl}
              alt=""
              className="w-5 h-5 rounded-full"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-gray-300" />
          )}
          <span>{goal.owner?.name || 'Unassigned'}</span>
        </div>
        <div>
          {total > 0 && (
            <span className="mr-2">
              {completed}/{total} milestones
            </span>
          )}
          {goal.dueDate && (
            <span>Due {new Date(goal.dueDate).toLocaleDateString()}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
