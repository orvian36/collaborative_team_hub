'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import useAnalyticsStore from '@/stores/analyticsStore';
import StatsTiles from '@/components/analytics/StatsTiles';
import GoalCompletionChart from '@/components/analytics/GoalCompletionChart';
import ExportButtons from '@/components/analytics/ExportButtons';

export default function DashboardHome() {
  const { workspaceId } = useParams();
  const { stats, isLoading, fetch } = useAnalyticsStore();

  useEffect(() => {
    fetch(workspaceId);
  }, [workspaceId, fetch]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <ExportButtons />
      </div>

      {isLoading || !stats ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <>
          <StatsTiles stats={stats} />
          <GoalCompletionChart data={stats.goalCompletionByMonth} />
        </>
      )}
    </div>
  );
}
