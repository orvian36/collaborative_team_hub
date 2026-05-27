import { create } from 'zustand';

const KEY = 'theme';

const useThemeStore = create((set, get) => ({
  theme: 'system', // 'light' | 'dark' | 'system' — kept SSR-consistent; real value loaded in hydrate()

  set: (theme) => {
    if (typeof window !== 'undefined') localStorage.setItem(KEY, theme);
    set({ theme });
    apply(theme);
  },

  cycle: () => {
    const order = ['light', 'dark', 'system'];
    const next = order[(order.indexOf(get().theme) + 1) % 3];
    get().set(next);
  },

  hydrate: () => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(KEY) || 'system';
    if (stored !== get().theme) set({ theme: stored });
    apply(stored);
  },
}));

function apply(theme) {
  if (typeof window === 'undefined') return;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
}

if (typeof window !== 'undefined') {
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      if (useThemeStore.getState().theme === 'system') apply('system');
    });
}

export default useThemeStore;
