import { GOAL_STATUS } from '@team-hub/shared';

const STYLES = {
  [GOAL_STATUS.NOT_STARTED]: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  [GOAL_STATUS.IN_PROGRESS]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  [GOAL_STATUS.COMPLETED]:   'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
};

const LABELS = {
  [GOAL_STATUS.NOT_STARTED]: 'Not started',
  [GOAL_STATUS.IN_PROGRESS]: 'In progress',
  [GOAL_STATUS.COMPLETED]:   'Completed',
};

export default function StatusPill({ status }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STYLES[status] || STYLES[GOAL_STATUS.NOT_STARTED]}`}>
      {LABELS[status] || status}
    </span>
  );
}
