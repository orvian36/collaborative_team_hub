'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import useAuditStore from '@/stores/auditStore';

export default function AuditTimeline() {
  const { workspaceId } = useParams();
  const { events, page, totalPages, isLoading, fetch } = useAuditStore();

  useEffect(() => { fetch(workspaceId, 1); }, [workspaceId, fetch]);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      {isLoading ? (
        <p className="p-6 text-sm text-gray-500">Loading…</p>
      ) : events.length === 0 ? (
        <p className="p-6 text-sm text-gray-500">No events match these filters.</p>
      ) : (
        <ul>
          {events.map((e) => (
            <li key={e.id} className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
              {e.user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={e.user.avatarUrl} alt="" className="w-7 h-7 rounded-full mt-0.5 flex-shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gray-300 mt-0.5 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-gray-600">
                  {(e.user?.name || '?')[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm">
                    <span className="font-medium text-gray-900 dark:text-white">{e.user?.name || 'Someone'}</span>{' '}
                    <span className="text-gray-700 dark:text-gray-300">{e.message}</span>
                  </p>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(e.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{e.type}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <button disabled={page <= 1}              onClick={() => fetch(workspaceId, page - 1)} className="text-sm text-primary-600 disabled:text-gray-400">← Previous</button>
          <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages}     onClick={() => fetch(workspaceId, page + 1)} className="text-sm text-primary-600 disabled:text-gray-400">Next →</button>
        </div>
      )}
    </div>
  );
}
