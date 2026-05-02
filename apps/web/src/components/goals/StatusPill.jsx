import { GOAL_STATUS } from '@team-hub/shared';

const STYLES = {
  [GOAL_STATUS.NOT_STARTED]:
    'bg-[color:var(--surface-3)] text-muted',
  [GOAL_STATUS.IN_PROGRESS]:
    'bg-primary-600/10 text-primary-700 dark:text-primary-300',
  [GOAL_STATUS.COMPLETED]:
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
};

const DOT = {
  [GOAL_STATUS.NOT_STARTED]: 'bg-ink-400',
  [GOAL_STATUS.IN_PROGRESS]: 'bg-primary-500',
  [GOAL_STATUS.COMPLETED]: 'bg-emerald-500',
};

const LABELS = {
  [GOAL_STATUS.NOT_STARTED]: 'Not started',
  [GOAL_STATUS.IN_PROGRESS]: 'In progress',
  [GOAL_STATUS.COMPLETED]: 'Completed',
};

export default function StatusPill({ status }) {
  const key = STYLES[status] ? status : GOAL_STATUS.NOT_STARTED;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${STYLES[key]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${DOT[key]}`} aria-hidden />
      {LABELS[key] || status}
    </span>
  );
}
