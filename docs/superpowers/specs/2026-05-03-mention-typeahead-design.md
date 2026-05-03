# Mention typeahead + TipTap editor sizing — design

**Date:** 2026-05-03
**Scope:** Frontend only. Backend mention extraction, sanitization, and notification pipeline are unchanged.

## Problem

Two surfaces in the app accept `@`-mentions:

1. **Announcement composer** (`apps/web/src/components/announcements/AnnouncementComposer.jsx`) — TipTap rich-text editor wired with `@tiptap/extension-mention`. The suggestion `render` is currently a no-op stub: items are fetched but no popup is rendered, so typing `@` in an announcement does nothing visible.
2. **Comments / goal-activity composer** (`apps/web/src/components/mentions/MentionTextarea.jsx`) — plain `<textarea>` with a basic inline popup. Works, but has no keyboard navigation, no avatars, and lives in its own implementation.

Additionally, the announcement editor wrapper has `min-h-[150px]` but the inner `.ProseMirror` doesn't fill it, so clicking outside the first text line doesn't focus the editor — the user perceives this as "single row of writing space."

## Goals

- Typing `@` in either surface opens a popup listing all workspace members.
- As the user types more characters, the list filters by **prefix-on-any-name-token** (e.g. `@al` matches both "Alice Smith" and "Bob Albright"). Email is not matched.
- User can select a member with mouse or keyboard (`↑` `↓` `Enter` `Tab` `Esc`).
- Both surfaces use the **same** popup component and feel identical.
- The TipTap editor has visibly more writing space and clicking anywhere inside the box focuses it.

## Non-goals

- Server-side search rewrite. The existing `GET /api/workspaces/:id/members` endpoint is fine; we'll filter client-side.
- Realtime "user just joined" updates inside an already-open popup. A 60-second cache TTL is adequate.
- Adding new dependencies (no `tippy.js`, no `cmdk` for this feature).
- Backend changes. Mention extraction (`apps/api/src/lib/mentions.js`), sanitization (`apps/api/src/lib/sanitize.js`), and notifications (`apps/api/src/lib/notifications.js`) are correct and stay untouched.

## Architecture

```
                    ┌──────────────────────────┐
                    │   useWorkspaceMembers    │   client-side cache hook
                    │   (workspaceId)          │   fetches once, 60s TTL
                    └──────────┬───────────────┘
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
   ┌────────────────────────┐   ┌────────────────────────┐
   │  AnnouncementComposer  │   │    MentionTextarea     │
   │  (TipTap rich text)    │   │    (plain textarea)    │
   └──────────┬─────────────┘   └────────────┬───────────┘
              │ suggestion.render             │ caret position
              ▼                               ▼
   ┌────────────────────────────────────────────────────┐
   │              MentionList (shared)                  │
   │   - renders avatar / name / email rows             │
   │   - keyboard nav (↑ ↓ Enter Tab Esc)               │
   │   - imperative API: onKeyDown(event) → handled     │
   └────────────────────────────────────────────────────┘
```

## New files

All under `apps/web/src/components/mentions/`:

### `MentionList.jsx`

Shared dropdown component used by both surfaces.

**Props:**

```jsx
<MentionList
  ref={listRef}              // forwardRef + useImperativeHandle
  items={filteredMembers}    // [{ user: { id, name, email, avatarUrl } }, ...]
  loading={boolean}
  onSelect={(member) => void}
  position={{ top, left }}   // viewport coordinates from caller
/>
```

**Imperative methods (via ref):**

- `onKeyDown(event) => boolean` — returns `true` if the popup consumed the key (`↑` `↓` `Enter` `Tab` `Esc`). Caller decides whether to `preventDefault`.

**Internal state:** `selectedIndex` (highlighted row), reset to `0` whenever `items` changes.

**Render:** rendered via `ReactDOM.createPortal` into `document.body` so it escapes any `overflow:hidden` parent (the announcement composer lives inside a `Modal`). Positioned with `position: fixed` using the `top`/`left` from props.

```
┌────────────────────────────────────┐
│ 👤 Alice Smith   alice@team.com    │ ← highlighted (bg-primary-50)
│ 👤 Bob Albright  bob@team.com      │
│ 👤 Khalid Noor   k@team.com        │
└────────────────────────────────────┘
```

- Width `w-72`, max 5 rows visible; scroll if more.
- Empty state: "No members match" when `items.length === 0 && !loading`.
- Loading state: skeleton row while initial fetch resolves.
- Each row: avatar (or initials placeholder when `avatarUrl` is null), bold name, muted email; click handler calls `onSelect(member)`.
- Tailwind tokens already used elsewhere: `bg-white dark:bg-gray-800`, `border border-gray-200 dark:border-gray-700`, `rounded-md shadow-lg`, primary highlight `bg-primary-50 dark:bg-primary-900/30`.

### `useWorkspaceMembers.js`

```js
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
    const cached = cache.get(workspaceId);
    if (cached && Date.now() - cached.fetchedAt < TTL_MS) return;
    setLoading(true);
    api.get(`/api/workspaces/${workspaceId}/members`)
      .then((r) => {
        cache.set(workspaceId, {
          members: r.members || [],
          fetchedAt: Date.now(),
        });
        setMembers(r.members || []);
      })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  return { members, loading };
}
```

Module-scope cache survives composer open/close within a session. 1-minute TTL handles the rare "Alice was just invited" case. If a workspace ever exceeds ~500 members we can swap server-side search behind the same hook signature.

### `filterMembers.js`

Pure function. Prefix-on-any-token, name-only.

```js
export function filterMembers(members, query) {
  const q = query.trim().toLowerCase();
  if (!q) return members.slice(0, 8); // show first 8 on bare @

  const scored = [];
  for (const m of members) {
    const name = (m.user.name || '').toLowerCase();
    const tokens = name.split(/\s+/);

    if (name.startsWith(q)) {
      scored.push([0, m]); // exact prefix on full name = best
      continue;
    }
    if (tokens.some((t) => t.startsWith(q))) {
      scored.push([1, m]); // prefix on any token = next best
    }
  }
  scored.sort(
    (a, b) => a[0] - b[0] || a[1].user.name.localeCompare(b[1].user.name)
  );
  return scored.slice(0, 8).map(([, m]) => m);
}
```

- Self-mention is **kept** in the list. Backend already drops self-notifications (`apps/api/src/lib/notifications.js:22`).
- Cap at 8 results — matches Slack/Linear and keeps the popup compact.

### `caretCoordinates.js`

Helper for the textarea path: render an off-screen mirror `<div>` that copies the textarea's font/padding/border, slice text up to caret, append a `<span>`, then read its `getBoundingClientRect()`. Returns `{ top, left }` in viewport coordinates. ~50 lines, isolated.

## Modified files

### `apps/web/src/components/announcements/AnnouncementComposer.jsx`

**Mention extension wiring** — replace the no-op `renderMentionPopup` with a real renderer:

```js
suggestion: {
  char: '@',
  items: ({ query }) => filterMembers(membersRef.current, query),
  render: () => {
    let root, container;
    const listRef = createRef();
    return {
      onStart: (props) => {
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
        const rect = props.clientRect?.();
        root.render(
          <MentionList
            ref={listRef}
            items={props.items}
            position={{ top: rect.bottom + 4, left: rect.left }}
            onSelect={(m) =>
              props.command({ id: m.user.id, label: m.user.name })
            }
          />
        );
      },
      onUpdate: (props) => {
        const rect = props.clientRect?.();
        root.render(
          <MentionList
            ref={listRef}
            items={props.items}
            position={{ top: rect.bottom + 4, left: rect.left }}
            onSelect={(m) =>
              props.command({ id: m.user.id, label: m.user.name })
            }
          />
        );
      },
      onKeyDown: (props) => listRef.current?.onKeyDown(props.event) ?? false,
      onExit: () => {
        root.unmount();
        container.remove();
      },
    };
  },
}
```

The composer calls `useWorkspaceMembers(workspaceId)` at the top and stashes the list in `membersRef` so the suggestion `items` callback (which lives outside React's render tree) can read it synchronously.

**Editor sizing fix:**

1. Wrapper `min-h-[150px]` → `min-h-[240px]`.
2. Add `tiptap-editor` class to the wrapper so the global CSS rule (below) takes effect.
3. Add `onClick={() => editor?.commands.focus()}` on the wrapper so clicks anywhere focus the editor.

### `apps/web/src/components/mentions/MentionTextarea.jsx`

Replace the inline `<div>` popup with `MentionList`. Compute caret position with `caretCoordinates`. Drop the per-keystroke `api.get(...)` (now using the cached `useWorkspaceMembers` + `filterMembers`). Token format on insert is unchanged: `@[Name](uuid)`.

```js
const onKeyDown = (e) => {
  if (showAt && listRef.current?.onKeyDown(e)) {
    e.preventDefault();
  }
};
```

### `apps/web/src/styles/tiptap.css` (new) + import in `apps/web/src/app/globals.css`

```css
.tiptap-editor .ProseMirror {
  min-height: 100%;
  outline: none;
}
.tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  color: rgb(156 163 175); /* gray-400 */
  pointer-events: none;
  float: left;
  height: 0;
}
```

This makes the inner ProseMirror fill the wrapper height, removing the "single row" feel.

## Data flow (TipTap example)

1. User types `@` in the announcement editor.
2. `@tiptap/suggestion` fires `onStart`. Our `items` callback calls `filterMembers(members, '')` and returns the first 8 members.
3. `MentionList` renders in a portal, anchored just below the caret.
4. User types `al`. Suggestion fires `onUpdate` with the new query. We re-render `MentionList` with filtered items.
5. User presses `↓`. Suggestion fires `onKeyDown` → `listRef.current.onKeyDown(event)` → returns `true`, suggestion plugin consumes it, the popup highlights row 2.
6. User presses `Enter`. Same path → `onKeyDown` returns `true` and additionally calls `props.command({ id, label })` via the row's `onSelect`. TipTap inserts a mention node, popup closes via `onExit`.
7. On submit, `editor.getHTML()` produces a `<span data-type="mention" data-id="..." data-label="...">` token. This is exactly what `apps/api/src/lib/mentions.js#extractFromHtml` already parses, so the backend pipeline keeps working.

## Edge cases

- **Popup overflows viewport** — initial implementation places below caret; if `rect.bottom + popupHeight > window.innerHeight`, flip to above caret. Acceptable to ship without flip and add it as a follow-up if it bites.
- **Whitespace after `@`** — TipTap suggestion handles this natively (closes the popup). The plain-text path already does the same check (`MentionTextarea.jsx:50`).
- **Backspacing past the `@`** — TipTap fires `onExit`. The plain-text path's `onKeyUp` recomputes `lastIndexOf('@')` and clears `showAt` when the `@` is gone.
- **No members loaded yet** — show the loading skeleton row; user can still type, results appear when fetch resolves.
- **No matches** — show "No members match" empty state; `Enter` is a no-op while empty.
- **Modal closes mid-popup** — `onExit` runs as the editor unmounts; React's portal cleanup handles the container removal.

## Testing

No test runner is configured in this repo. Manual smoke test plan:

1. Open the announcement composer → type `@` → all members appear (or first 8 if more than 8).
2. Type `al` → list narrows to members whose name has any token starting with "al".
3. `↓ ↓ Enter` selects the third row → mention chip inserted, popup closes.
4. Click a row with mouse → same result.
5. Open the comments composer on an announcement → repeat 1–4.
6. Click anywhere in the editor box (top, middle, bottom) → editor focuses and shows a cursor.
7. Type a multi-paragraph announcement → editor grows naturally past `min-h-[240px]`.
8. Submit announcement → backend stores HTML, notification fires for the mentioned user (verify in DB or via the bell icon for the recipient).

## Out-of-scope follow-ups

- Viewport-flip when the popup would overflow.
- Server-side member search if the workspace ever exceeds ~500 members.
- Mention render styling pass (consistent chip across announcement HTML and comment markdown).
- Rich-text mentions in goal-activity messages (currently uses the plain-text textarea — same component will benefit automatically once this lands).
