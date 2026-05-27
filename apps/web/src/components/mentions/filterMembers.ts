// apps/web/src/components/mentions/filterMembers.js

/**
 * Filter workspace members for an @-mention popup.
 *
 * Matching: prefix-on-any-name-token. "al" matches "Alice Smith" (prefix on
 * full name) AND "Bob Albright" (prefix on the second token). Email is NOT
 * matched. Self-mentions are NOT filtered here — they're a legitimate UX
 * and the backend drops self-notifications.
 *
 * Sort: full-name prefix matches first, then any-token matches, ties broken
 * by name (locale-aware).
 *
 * Cap: returns at most 8 results, including for the empty-query case (bare @).
 *
 * @param {Array<{user: {id: string, name: string|null, email: string, avatarUrl: string|null}}>} members
 * @param {string} query - text typed after the @ (without the @)
 * @returns {Array<typeof members[number]>}
 */
export function filterMembers(members, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return members.slice(0, 8);

  const scored = [];
  for (const m of members) {
    const name = (m.user?.name || '').toLowerCase();
    if (!name) continue;
    const tokens = name.split(/\s+/).filter(Boolean);

    if (name.startsWith(q)) {
      scored.push([0, m]);
      continue;
    }
    if (tokens.some((t) => t.startsWith(q))) {
      scored.push([1, m]);
    }
  }

  scored.sort(
    (a, b) =>
      a[0] - b[0] ||
      (a[1].user.name || '').localeCompare(b[1].user.name || '')
  );
  return scored.slice(0, 8).map(([, m]) => m);
}
