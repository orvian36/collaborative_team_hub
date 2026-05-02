'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

const PRIORITY_STYLES = {
  LOW:    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  MEDIUM: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  HIGH:   'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  URGENT: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

export default function ActionItemCard({ item, dragHandleProps, onClick }) {
  const { workspaceId } = useParams();
  return (
    <div
      onClick={onClick}
      {...(dragHandleProps || {})}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3 cursor-pointer hover:shadow-md transition-shadow text-left"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</h4>
        <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.MEDIUM}`}>
          {item.priority}
        </span>
      </div>
      {item.goal && (
        <Link
          href={`/dashboard/${workspaceId}/goals/${item.goal.id}`}
          onClick={(e) => e.stopPropagation()}
          className="block mt-2 text-xs text-primary-600 hover:underline truncate"
        >
          → {item.goal.title}
        </Link>
      )}
      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          {item.assignee?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.assignee.avatarUrl} alt="" className="w-5 h-5 rounded-full" />
          ) : item.assignee ? (
            <div className="w-5 h-5 rounded-full bg-gray-300" />
          ) : (
            <span className="text-gray-400">Unassigned</span>
          )}
          {item.assignee && <span className="truncate max-w-[120px]">{item.assignee.name}</span>}
        </div>
        {item.dueDate && <span>{new Date(item.dueDate).toLocaleDateString()}</span>}
      </div>
    </div>
  );
}
