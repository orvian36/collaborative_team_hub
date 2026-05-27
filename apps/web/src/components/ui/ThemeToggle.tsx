'use client';

import { useEffect } from 'react';
import useThemeStore from '@/stores/themeStore';

export default function ThemeToggle() {
  const { theme, cycle, hydrate } = useThemeStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const Icon = theme === 'light' ? SunIcon : theme === 'dark' ? MoonIcon : MonitorIcon;
  const next =
    theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';

  return (
    <button
      type="button"
      onClick={cycle}
      title={`Theme: ${theme}. Click for ${next}.`}
      aria-label={`Theme: ${theme}. Click to switch to ${next}.`}
      className="inline-flex items-center justify-center w-9 h-9 rounded-full text-muted hover:text-fg hover:bg-[color:var(--surface-2)] transition-colors focus-ring"
    >
      <Icon className="w-[17px] h-[17px]" />
    </button>
  );
}

function SunIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

function MonitorIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}
