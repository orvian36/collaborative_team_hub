'use client';

import { useCapability } from '@/hooks/useCapability';

export default function PermissionGate({ cap, fallback = null, children }) {
  const allowed = useCapability(cap);
  return allowed ? children : fallback;
}
