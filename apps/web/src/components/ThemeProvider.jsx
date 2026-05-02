'use client';

import { useEffect } from 'react';
import useThemeStore from '@/stores/themeStore';

export default function ThemeProvider({ children }) {
  const hydrate = useThemeStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return <>{children}</>;
}
