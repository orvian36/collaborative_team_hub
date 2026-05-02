'use client';

import { useState } from 'react';
import useNotificationsStore from '@/stores/notificationsStore';
import NotificationsPanel from './NotificationsPanel';

export default function NotificationsBell() {
  const { unreadCount } = useNotificationsStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
        aria-label="Notifications"
      >
        {/* Bell icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 2h16l-2-2z" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && <NotificationsPanel onClose={() => setOpen(false)} />}
    </div>
  );
}
