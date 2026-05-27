// apps/web/src/components/mentions/useWorkspaceMembers.js
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

/**
 * Module-scope cache of workspace members so the mention popup opens
 * instantly without a per-keystroke network roundtrip. 60-second TTL is
 * enough to feel fresh during an active session; new invitees show up
 * the next time the popup is opened after the TTL expires.
 *
 * If a workspace ever exceeds ~500 members we can swap server-side
 * search behind this same hook signature.
 */
const cache = new Map(); // workspaceId -> { members, fetchedAt }
const TTL_MS = 60_000;

export function useWorkspaceMembers(workspaceId) {
  const [members, setMembers] = useState(
    () => cache.get(workspaceId)?.members || []
  );
  const [loading, setLoading] = useState(
    () => !cache.get(workspaceId)?.members
  );

  useEffect(() => {
    if (!workspaceId) return;
    const cached = cache.get(workspaceId);
    if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
      setMembers(cached.members);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .get(`/api/workspaces/${workspaceId}/members`)
      .then((r) => {
        if (cancelled) return;
        const list = r.members || [];
        cache.set(workspaceId, { members: list, fetchedAt: Date.now() });
        setMembers(list);
      })
      .catch(() => {
        // swallow — popup will show empty state; caller can retry by reopening
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  return { members, loading };
}
