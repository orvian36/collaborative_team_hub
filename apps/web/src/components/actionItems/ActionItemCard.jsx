'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

const PRIORITY_STYLES = {
  LOW: 'bg-[color:var(--surface-3)] text-muted',
  MEDIUM: 'bg-primary-600/10 text-primary-700 dark:text-primary-300',
  HIGH: 'bg-accent-100 text-accent-800 dark:bg-accent-300/15 dark:text-accent-300',
  URGENT: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
};

const PRIORITY_DOT = {
  LOW: 'bg-ink-400',
  MEDIUM: 'bg-primary-500',
  HIGH: 'bg-accent-500',
  URGENT: 'bg-rose-500',
};

export default function ActionItemCard({ item, dragHandleProps, onClick }) {
  const { workspaceId } = useParams();
  const priority = item.priority || 'MEDIUM';

  return (
    <div
      onClick={onClick}
      {...(dragHandleProps || {})}
      className="group rounded-xl border border-line bg-[color:var(--surface)] p-3.5 cursor-pointer transition-all hover:border-line-strong hover:shadow-lift text-left"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <span
            className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${PRIORITY_DOT[priority]}`}
            aria-hidden
          />
          <h4 className="text-sm font-semibold text-fg tracking-tight leading-snug line-clamp-2">
            {item.title}
          </h4>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider whitespace-nowrap ${PRIORITY_STYLES[priority]}`}
        >
          {priority}
        </span>
      </div>

      {item.goal && (
        <Link
          href={`/dashboard/${workspaceId}/goals/${item.goal.id}`}
          onClick={(e) => e.stopPropagation()}
          className="mt-2.5 inline-flex items-center gap-1 text-xs text-muted hover:text-primary-700 dark:hover:text-primary-300 transition-colors max-w-full"
        >
          <svg
            viewBox="0 0 12 12"
            className="w-3 h-3 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="6" cy="6" r="4.5" />
            <circle cx="6" cy="6" r="2" />
          </svg>
          <span className="truncate">{item.goal.title}</span>
        </Link>
      )}

      <div className="flex items-center justify-between mt-3 text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          {item.assignee?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.assignee.avatarUrl}
              alt=""
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : item.assignee ? (
            <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/40 grid place-items-center text-[9px] font-semibold text-primary-700 dark:text-primary-300">
              {(item.assignee.name?.[0] || '?').toUpperCase()}
            </span>
          ) : (
            <span className="text-subtle italic">Unassigned</span>
          )}
          {item.assignee && (
            <span className="text-muted truncate max-w-[120px]">
              {item.assignee.name}
            </span>
          )}
        </div>
        {item.dueDate && (
          <span className="text-subtle font-mono whitespace-nowrap">
            {new Date(item.dueDate).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        )}
      </div>
    </div>
  );
}
