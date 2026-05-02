'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useNotificationsStore from '@/stores/notificationsStore';

export default function NotificationsPanel({ onClose }) {
  const router = useRouter();
  const { items, markRead, markAllRead } = useNotificationsStore();
  const ref = useRef(null);

  useEffect(() => {
    const onClickAway = (e) => {
      if (!ref.current?.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, [onClose]);

  const onClick = (n) => {
    if (!n.isRead) markRead(n.id);
    if (n.entityType === 'announcement' && n.entityId) {
      // We don't have workspaceId on the notification; the panel only shows links for current-workspace items.
      // Easiest path: navigate to /dashboard and let the user navigate manually for cross-workspace cases.
      onClose();
    } else {
      onClose();
    }
  };

  return (
    <div ref={ref} className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
        <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline">Mark all read</button>
      </div>
      <ul className="max-h-96 overflow-y-auto">
        {items.length === 0 ? (
          <li className="p-4 text-sm text-gray-500 text-center">No notifications</li>
        ) : items.map((n) => (
          <li key={n.id}
            onClick={() => onClick(n)}
            className={`p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 ${!n.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
          >
            <p className="text-sm text-gray-800 dark:text-gray-200">{n.message}</p>
            <p className="text-xs text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
