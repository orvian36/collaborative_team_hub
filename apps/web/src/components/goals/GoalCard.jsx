import Link from 'next/link';
import StatusPill from './StatusPill';

export default function GoalCard({ goal, workspaceId }) {
  const completed =
    goal.milestones?.filter((m) => m.progress === 100).length || 0;
  const total = goal.milestones?.length || 0;
  const progressPct = total ? (completed / total) * 100 : 0;

  return (
    <Link
      href={`/dashboard/${workspaceId}/goals/${goal.id}`}
      className="group block rounded-xl border border-line bg-[color:var(--surface)] p-5 transition-all hover:border-line-strong hover:shadow-lift focus-ring"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-fg tracking-tight line-clamp-2 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
          {goal.title}
        </h3>
        <StatusPill status={goal.status} />
      </div>

      {goal.description && (
        <p className="text-sm text-muted line-clamp-2 mb-4">
          {goal.description}
        </p>
      )}

      {total > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-subtle font-medium uppercase tracking-wider">
              Milestones
            </span>
            <span className="font-mono text-muted">
              {completed}/{total}
            </span>
          </div>
          <div className="h-1 rounded-full bg-[color:var(--surface-3)] overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 min-w-0">
          {goal.owner?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={goal.owner.avatarUrl}
              alt=""
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/40 grid place-items-center text-[9px] font-semibold text-primary-700 dark:text-primary-300">
              {(goal.owner?.name?.[0] || '?').toUpperCase()}
            </span>
          )}
          <span className="text-muted truncate">
            {goal.owner?.name || 'Unassigned'}
          </span>
        </div>
        {goal.dueDate && (
          <span className="text-subtle font-mono whitespace-nowrap">
            {new Date(goal.dueDate).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        )}
      </div>
    </Link>
  );
}
