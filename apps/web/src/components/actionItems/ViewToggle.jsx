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
    <div className="inline-flex rounded-md border border-gray-300 dark:border-gray-700 overflow-hidden">
      {['kanban', 'list'].map((v) => (
        <button
          key={v}
          onClick={() => set(v)}
          className={`px-3 py-1 text-sm capitalize ${
            value === v
              ? 'bg-primary-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
