'use client';

import useActionItemsStore from '@/stores/actionItemsStore';

export default function ActionItemList({ onEdit }) {
  const { byStatus } = useActionItemsStore();
  const all = [
    ...(byStatus.TODO || []),
    ...(byStatus.IN_PROGRESS || []),
    ...(byStatus.DONE || []),
  ];

  if (all.length === 0)
    return <p className="text-gray-500">No action items.</p>;

  return (
    <table className="w-full text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
      <thead className="text-xs uppercase text-gray-500 bg-gray-50 dark:bg-gray-900/50">
        <tr>
          <th className="text-left px-3 py-2">Title</th>
          <th className="text-left px-3 py-2">Status</th>
          <th className="text-left px-3 py-2">Priority</th>
          <th className="text-left px-3 py-2">Assignee</th>
          <th className="text-left px-3 py-2">Goal</th>
          <th className="text-left px-3 py-2">Due</th>
        </tr>
      </thead>
      <tbody>
        {all.map((it) => (
          <tr
            key={it.id}
            onClick={() => onEdit(it)}
            className="border-t border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50"
          >
            <td className="px-3 py-2 text-gray-900 dark:text-white">
              {it.title}
            </td>
            <td className="px-3 py-2">{it.status}</td>
            <td className="px-3 py-2">{it.priority}</td>
            <td className="px-3 py-2">{it.assignee?.name || '—'}</td>
            <td className="px-3 py-2">{it.goal?.title || '—'}</td>
            <td className="px-3 py-2">
              {it.dueDate ? new Date(it.dueDate).toLocaleDateString() : '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
