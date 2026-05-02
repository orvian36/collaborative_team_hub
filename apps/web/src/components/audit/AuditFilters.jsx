'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ACTIVITY_TYPES } from '@team-hub/shared';
import useAuditStore from '@/stores/auditStore';
import useWorkspaceMembersStore from '@/stores/workspaceMembersStore';

export default function AuditFilters() {
  const { workspaceId } = useParams();
  const { filters, setFilters, fetch } = useAuditStore();
  const { members, fetchMembers } = useWorkspaceMembersStore();

  useEffect(() => {
    if (members.length === 0) fetchMembers(workspaceId);
  }, [workspaceId, members.length, fetchMembers]);

  const apply = () => fetch(workspaceId, 1);
  const clear = () => { setFilters({ type: '', actorId: '', from: '', to: '' }); fetch(workspaceId, 1); };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
        <select value={filters.type} onChange={(e) => setFilters({ type: e.target.value })}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900 dark:text-white">
          <option value="">All</option>
          {Object.values(ACTIVITY_TYPES).map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Actor</label>
        <select value={filters.actorId} onChange={(e) => setFilters({ actorId: e.target.value })}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900 dark:text-white">
          <option value="">All members</option>
          {members.map((m) => <option key={m.id} value={m.user.id}>{m.user.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">From</label>
        <input type="date" value={filters.from} onChange={(e) => setFilters({ from: e.target.value })}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900 dark:text-white" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">To</label>
        <input type="date" value={filters.to} onChange={(e) => setFilters({ to: e.target.value })}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900 dark:text-white" />
      </div>
      <div className="flex gap-2">
        <button onClick={apply} className="flex-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700">Apply</button>
        <button onClick={clear} className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">Clear</button>
      </div>
    </div>
  );
}
