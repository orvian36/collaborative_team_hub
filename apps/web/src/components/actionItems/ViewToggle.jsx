'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function ViewToggle({ value }) {
  const router = useRouter();
  const params = useSearchParams();

  const set = (next) => {
    const q = new URLSearchParams(params);
    q.set('view', next);
    router.replace(`?${q.toString()}`);
  };

  return (
    <div
      className="inline-flex rounded-full bg-[color:var(--surface-2)] border border-line p-0.5"
      role="tablist"
    >
      {[
        { v: 'kanban', icon: KanbanIcon, label: 'Kanban' },
        { v: 'list', icon: ListIcon, label: 'List' },
      ].map(({ v, icon: Icon, label }) => {
        const active = value === v;
        return (
          <button
            key={v}
            role="tab"
            aria-selected={active}
            onClick={() => set(v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
              active
                ? 'bg-[color:var(--surface)] text-fg shadow-soft'
                : 'text-muted hover:text-fg'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

function KanbanIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="2" y="3" width="3.5" height="10" rx="1" />
      <rect x="6.25" y="3" width="3.5" height="6.5" rx="1" />
      <rect x="10.5" y="3" width="3.5" height="8" rx="1" />
    </svg>
  );
}
function ListIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M5 4h9M5 8h9M5 12h9" />
      <circle cx="2.5" cy="4" r="0.75" fill="currentColor" />
      <circle cx="2.5" cy="8" r="0.75" fill="currentColor" />
      <circle cx="2.5" cy="12" r="0.75" fill="currentColor" />
    </svg>
  );
}
