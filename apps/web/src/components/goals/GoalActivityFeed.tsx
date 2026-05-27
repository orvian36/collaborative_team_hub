'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

export default function GoalActivityFeed({ goalId }) {
  const { workspaceId } = useParams();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { activities } = await api.get(
          `/api/workspaces/${workspaceId}/goals/${goalId}/activity`
        );
        if (!cancelled) setActivities(activities);
      } catch {
        // ignore for now
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId, goalId]);

  if (loading)
    return <p className="text-sm text-gray-500">Loading activity…</p>;
  if (activities.length === 0)
    return <p className="text-sm text-gray-500">No activity yet.</p>;

  return (
    <ul className="space-y-3">
      {activities.map((a) => (
        <li key={a.id} className="flex gap-3 text-sm">
          {a.user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={a.user.avatarUrl}
              alt=""
              className="w-7 h-7 rounded-full mt-0.5 flex-shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gray-300 mt-0.5 flex-shrink-0" />
          )}
          <div>
            <span className="font-medium text-gray-900 dark:text-white">
              {a.user?.name || 'Someone'}
            </span>
            <span className="text-gray-700 dark:text-gray-300">
              {' '}
              {a.message}
            </span>
            <div className="text-xs text-gray-500">
              {new Date(a.createdAt).toLocaleString()}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
