'use client';

import { useEffect } from 'react';
import useThemeStore from '@/stores/themeStore';

export default function ThemeToggle() {
  const { theme, cycle, hydrate } = useThemeStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const label = theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '🖥️';
  return (
    <button
      onClick={cycle}
      title={`Theme: ${theme} (click to cycle)`}
      className="p-2 text-base hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
    >
      {label}
    </button>
  );
}
