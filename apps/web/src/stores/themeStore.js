import { create } from 'zustand';

const KEY = 'theme';

const initial = (() => {
  if (typeof window === 'undefined') return 'system';
  return localStorage.getItem(KEY) || 'system';
})();

const useThemeStore = create((set, get) => ({
  theme: initial, // 'light' | 'dark' | 'system'

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
    apply(get().theme);
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
