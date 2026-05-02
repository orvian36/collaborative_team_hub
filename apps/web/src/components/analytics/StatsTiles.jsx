'use client';

const TILE = 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5';

export default function StatsTiles({ stats }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className={TILE}>
        <p className="text-xs uppercase text-gray-500">Total goals</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalGoals}</p>
        <p className="text-xs text-gray-500 mt-2">
          {stats.goalsByStatus?.COMPLETED ?? 0} completed · {stats.goalsByStatus?.IN_PROGRESS ?? 0} in progress
        </p>
      </div>
      <div className={TILE}>
        <p className="text-xs uppercase text-gray-500">Items completed this week</p>
        <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.completedActionItemsThisWeek}</p>
      </div>
      <div className={TILE}>
        <p className="text-xs uppercase text-gray-500">Overdue items</p>
        <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.overdueActionItems}</p>
      </div>
    </div>
  );
}
