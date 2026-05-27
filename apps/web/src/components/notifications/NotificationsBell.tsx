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
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex items-center justify-center w-9 h-9 rounded-full text-muted hover:text-fg hover:bg-[color:var(--surface-2)] transition-colors focus-ring"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <svg
          viewBox="0 0 24 24"
          className="w-[17px] h-[17px]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 2h16l-2-2z" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[10px] rounded-full grid place-items-center font-semibold ring-2 ring-[color:var(--surface)]"
            aria-hidden
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && <NotificationsPanel onClose={() => setOpen(false)} />}
    </div>
  );
}
