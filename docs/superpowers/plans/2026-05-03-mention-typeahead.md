# Mention Typeahead Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a shared `@`-mention popup used by both the TipTap announcement editor and the plain-text comment textarea, and fix the announcement editor's "single row of writing space" focus issue.

**Architecture:** One `MentionList` React component (forwardRef + imperative `onKeyDown`) is mounted via portal from two surfaces. Members are fetched once per workspace (60s TTL cache) and filtered client-side using prefix-on-any-name-token matching. The TipTap `suggestion` plugin's `render` is rewritten to bridge into `MentionList`; the textarea computes caret coordinates via a mirror `<div>` and anchors the same component there. Editor sizing is fixed with a small CSS file plus a wrapper click-to-focus handler.

**Tech Stack:** Next.js 16 App Router, React 19, `@tiptap/react` v3, `@tiptap/extension-mention`, `@tiptap/suggestion`, Tailwind. **No new dependencies.** No test runner is configured in this repo (per `CLAUDE.md`); pure helpers are verified with `node -e` smoke scripts and UI changes get explicit manual verification.

**Spec:** `docs/superpowers/specs/2026-05-03-mention-typeahead-design.md`

---

### Task 1: `filterMembers` pure function

**Files:**

- Create: `apps/web/src/components/mentions/filterMembers.js`

- [ ] **Step 1: Create the file**

```js
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
```

- [ ] **Step 2: Smoke-test the function with a `node -e` script**

Run from the repo root:

```bash
node --input-type=module -e "
import { filterMembers } from './apps/web/src/components/mentions/filterMembers.js';
const members = [
  { user: { id: '1', name: 'Alice Smith',   email: 'alice@x.com', avatarUrl: null } },
  { user: { id: '2', name: 'Bob Albright',  email: 'bob@x.com',   avatarUrl: null } },
  { user: { id: '3', name: 'Khalid Noor',   email: 'k@x.com',     avatarUrl: null } },
  { user: { id: '4', name: 'Carol Adams',   email: 'c@x.com',     avatarUrl: null } },
];
const log = (label, q) =>
  console.log(label, JSON.stringify(filterMembers(members, q).map(m => m.user.name)));
log('empty:', '');
log('al:   ', 'al');
log('Alic: ', 'Alic');
log('z:    ', 'z');
"
```

Expected output (exactly):

```
empty: ["Alice Smith","Bob Albright","Khalid Noor","Carol Adams"]
al:    ["Alice Smith","Carol Adams","Bob Albright"]
Alic:  ["Alice Smith"]
z:     []
```

Note: `Carol Adams` ranks above `Bob Albright` for `al` because both score 1 (any-token match) and `Adams` < `Albright` alphabetically.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/mentions/filterMembers.js
git commit -m "feat(web): add filterMembers helper for mention typeahead

Pure function: prefix-on-any-name-token match, name-only (not email),
sorted by match quality then name. Caps at 8 results."
```

---

### Task 2: `useWorkspaceMembers` cache hook

**Files:**

- Create: `apps/web/src/components/mentions/useWorkspaceMembers.js`

- [ ] **Step 1: Create the file**

```js
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
```

- [ ] **Step 2: Verify the file imports cleanly**

This is a React hook; we'll exercise it through the UI in later tasks. For now just confirm Next's compiler accepts it. From the repo root:

```bash
npm run lint --workspace=@team-hub/web
```

Expected: lint passes (or only emits warnings unrelated to this file).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/mentions/useWorkspaceMembers.js
git commit -m "feat(web): add useWorkspaceMembers hook with 60s cache

Fetches workspace members once per workspaceId and caches in
module-scope so the mention popup opens with no network latency."
```

---

### Task 3: `MentionList` shared dropdown component

**Files:**

- Create: `apps/web/src/components/mentions/MentionList.jsx`

- [ ] **Step 1: Create the file**

```jsx
// apps/web/src/components/mentions/MentionList.jsx
'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

/**
 * Shared mention dropdown. Rendered into a portal at viewport-fixed
 * coordinates so it escapes any overflow:hidden parent (e.g. the
 * announcement composer's Modal).
 *
 * Imperative API (via ref):
 *   onKeyDown(event) => boolean  // true if the popup consumed the key
 */
const MentionList = forwardRef(function MentionList(
  { items, loading, onSelect, position },
  ref
) {
  const [selected, setSelected] = useState(0);
  const itemRefs = useRef([]);

  useEffect(() => {
    setSelected(0);
  }, [items]);

  useEffect(() => {
    itemRefs.current[selected]?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  useImperativeHandle(
    ref,
    () => ({
      onKeyDown(event) {
        if (event.key === 'ArrowDown') {
          if (items.length === 0) return true;
          setSelected((i) => (i + 1) % items.length);
          return true;
        }
        if (event.key === 'ArrowUp') {
          if (items.length === 0) return true;
          setSelected((i) => (i - 1 + items.length) % items.length);
          return true;
        }
        if (event.key === 'Enter' || event.key === 'Tab') {
          if (items.length === 0) return false;
          const m = items[selected];
          if (m) onSelect(m);
          return true;
        }
        if (event.key === 'Escape') {
          // Caller decides what to do (close popup); we just signal handled.
          return true;
        }
        return false;
      },
    }),
    [items, selected, onSelect]
  );

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="listbox"
      style={{
        position: 'fixed',
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        zIndex: 60,
      }}
      className="w-72 max-h-60 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1"
    >
      {loading && items.length === 0 ? (
        <div className="px-3 py-2 text-sm text-gray-500">Loading members…</div>
      ) : items.length === 0 ? (
        <div className="px-3 py-2 text-sm text-gray-500">No members match</div>
      ) : (
        items.map((m, i) => {
          const isActive = i === selected;
          return (
            <button
              key={m.user.id}
              ref={(el) => (itemRefs.current[i] = el)}
              type="button"
              role="option"
              aria-selected={isActive}
              // mousedown so we fire before the textarea's blur
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(m);
              }}
              onMouseEnter={() => setSelected(i)}
              className={
                'w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 ' +
                (isActive
                  ? 'bg-primary-50 dark:bg-primary-900/30'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/40')
              }
            >
              {m.user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.user.avatarUrl}
                  alt=""
                  className="w-6 h-6 rounded-full flex-shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center text-[10px] font-medium text-gray-600 dark:text-gray-300">
                  {(m.user.name || '?').slice(0, 1).toUpperCase()}
                </div>
              )}
              <span className="font-medium text-gray-900 dark:text-white truncate">
                {m.user.name}
              </span>
              <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 truncate">
                {m.user.email}
              </span>
            </button>
          );
        })
      )}
    </div>,
    document.body
  );
});

export default MentionList;
```

- [ ] **Step 2: Verify the file lints**

```bash
npm run lint --workspace=@team-hub/web
```

Expected: lint passes.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/mentions/MentionList.jsx
git commit -m "feat(web): add shared MentionList dropdown with keyboard nav

Portal-rendered, fixed-positioned, forwardRef + onKeyDown imperative
API for both TipTap and plain-text consumers. Avatar/name/email rows,
arrow keys + Enter/Tab/Esc."
```

---

### Task 4: `caretCoordinates` helper for textareas

**Files:**

- Create: `apps/web/src/components/mentions/caretCoordinates.js`

- [ ] **Step 1: Create the file**

```js
// apps/web/src/components/mentions/caretCoordinates.js
'use client';

/**
 * Compute viewport coordinates of the caret inside a <textarea>.
 *
 * Approach: render an absolutely-positioned, off-screen <div> that mirrors
 * the textarea's font/padding/border styles, slice the textarea's value up
 * to the caret index, append a marker <span>, then read the marker's
 * bounding rect. This is the standard technique — the DOM has no native
 * "caret position" API for textareas.
 *
 * Returns { top, left } in viewport coordinates (suitable for position:fixed).
 */
const COPIED_PROPS = [
  'direction',
  'boxSizing',
  'width',
  'height',
  'overflowX',
  'overflowY',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderStyle',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'fontSizeAdjust',
  'lineHeight',
  'fontFamily',
  'textAlign',
  'textTransform',
  'textIndent',
  'textDecoration',
  'letterSpacing',
  'wordSpacing',
  'tabSize',
];

export function getCaretCoordinates(textarea, position) {
  if (typeof document === 'undefined' || !textarea) {
    return { top: 0, left: 0 };
  }

  const div = document.createElement('div');
  div.id = '__mention_caret_mirror__';
  document.body.appendChild(div);

  const style = div.style;
  const computed = window.getComputedStyle(textarea);

  style.whiteSpace = 'pre-wrap';
  style.wordWrap = 'break-word';
  style.position = 'absolute';
  style.visibility = 'hidden';
  style.top = '0';
  style.left = '-9999px';

  for (const prop of COPIED_PROPS) {
    style[prop] = computed[prop];
  }

  div.textContent = textarea.value.substring(0, position);
  const span = document.createElement('span');
  // A non-empty span makes sure we get a measurable rect even at end of text.
  span.textContent = textarea.value.substring(position) || '.';
  div.appendChild(span);

  const taRect = textarea.getBoundingClientRect();
  const spanRect = span.getBoundingClientRect();
  const mirrorRect = div.getBoundingClientRect();

  // Account for the mirror sitting at left:-9999px by subtracting its origin.
  const top =
    taRect.top + (spanRect.top - mirrorRect.top) - textarea.scrollTop;
  const left =
    taRect.left + (spanRect.left - mirrorRect.left) - textarea.scrollLeft;

  document.body.removeChild(div);

  // Drop the popup just below the caret line. Using line-height as the
  // approximate caret height keeps the offset stable across font sizes.
  const lineHeight = parseFloat(computed.lineHeight) || 18;
  return { top: top + lineHeight + 4, left };
}
```

- [ ] **Step 2: Verify the file lints**

```bash
npm run lint --workspace=@team-hub/web
```

Expected: lint passes.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/mentions/caretCoordinates.js
git commit -m "feat(web): add caret coordinate helper for textarea mention popup

Mirror-div technique to compute viewport position of the caret inside
a textarea. Used to anchor MentionList just below the @ token."
```

---

### Task 5: Wire `MentionList` into `MentionTextarea` (comments)

**Files:**

- Modify: `apps/web/src/components/mentions/MentionTextarea.jsx` (full rewrite — file is small)

- [ ] **Step 1: Replace the file contents**

```jsx
// apps/web/src/components/mentions/MentionTextarea.jsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { filterMembers } from './filterMembers';
import { useWorkspaceMembers } from './useWorkspaceMembers';
import { getCaretCoordinates } from './caretCoordinates';
import MentionList from './MentionList';

/**
 * Plain-text textarea with @-mention typeahead. Emits the value as
 * markdown-style tokens: "Hi @[Alice Smith](user-id-uuid)".
 *
 * Used by comments and the goal-activity composer. The TipTap editor in
 * AnnouncementComposer handles its own mention extension but mounts the
 * same MentionList component for visual parity.
 */
export default function MentionTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}) {
  const { workspaceId } = useParams();
  const { members, loading } = useWorkspaceMembers(workspaceId);
  const taRef = useRef(null);
  const listRef = useRef(null);
  // showAt: { start, caret } — start is the @ index, caret is the cursor index
  const [showAt, setShowAt] = useState(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const query = showAt ? value.slice(showAt.start + 1, showAt.caret) : '';
  const filtered = useMemo(
    () => (showAt ? filterMembers(members, query) : []),
    [members, query, showAt]
  );

  const closePopup = () => setShowAt(null);

  const recomputeFromCaret = (caret) => {
    const before = value.slice(0, caret);
    const at = before.lastIndexOf('@');
    if (at < 0) return closePopup();
    // Bail if there's whitespace between the @ and the caret.
    if (/\s/.test(before.slice(at + 1))) return closePopup();
    // Bail if @ is mid-word (e.g. an email address).
    const charBefore = at > 0 ? before[at - 1] : '';
    if (charBefore && !/\s/.test(charBefore)) return closePopup();
    setShowAt({ start: at, caret });
    if (taRef.current) {
      setPosition(getCaretCoordinates(taRef.current, at));
    }
  };

  const onChangeInternal = (e) => {
    onChange(e.target.value);
    // Defer to next tick so selectionStart reflects the post-change caret.
    requestAnimationFrame(() => {
      const ta = taRef.current;
      if (ta) recomputeFromCaret(ta.selectionStart);
    });
  };

  const onKeyDown = (e) => {
    if (!showAt) return;
    // Esc always closes; let MentionList tell us if it consumed nav keys.
    if (e.key === 'Escape') {
      e.preventDefault();
      closePopup();
      return;
    }
    const handled = listRef.current?.onKeyDown(e);
    if (handled) e.preventDefault();
  };

  const insertMention = (member) => {
    if (!showAt) return;
    const token = `@[${member.user.name}](${member.user.id})`;
    const next = value.slice(0, showAt.start) + token + value.slice(showAt.caret);
    onChange(next);
    closePopup();
    requestAnimationFrame(() => {
      const ta = taRef.current;
      if (!ta) return;
      const pos = showAt.start + token.length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  };

  // Close the popup if the textarea loses focus (clicking the popup uses
  // mousedown + preventDefault so it does NOT blur the textarea).
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    const onBlur = () => closePopup();
    ta.addEventListener('blur', onBlur);
    return () => ta.removeEventListener('blur', onBlur);
  }, []);

  return (
    <>
      <textarea
        ref={taRef}
        value={value}
        onChange={onChangeInternal}
        onKeyDown={onKeyDown}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      {showAt && (
        <MentionList
          ref={listRef}
          items={filtered}
          loading={loading}
          onSelect={insertMention}
          position={position}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Manually verify the comment surface**

Start the stack:

```bash
npm run dev
```

In a browser:

1. Log in and open a workspace dashboard with an announcement that exists (`/dashboard/<workspaceId>/announcements/<announcementId>`, or open the announcement detail).
2. Click the comment textarea, type `@`. **Expected:** popup appears anchored just below the caret showing up to 8 workspace members.
3. Type a letter (e.g. `a`). **Expected:** list narrows by prefix-on-any-token; first row highlighted.
4. Press `↓` twice, then `Enter`. **Expected:** the third row's name is inserted as `@Name` chip-styled in the rendered comment; in the textarea the raw token is `@[Name](uuid)`.
5. Type `@xyz123`. **Expected:** "No members match" empty state.
6. Type `@`, then click a row with the mouse. **Expected:** mention inserted, textarea retains focus.
7. Type `@`, press `Esc`. **Expected:** popup closes; cursor still in textarea.
8. Submit the comment. **Expected:** other tabs (or just refresh) show the chip rendered via the existing `renderMentions` in `CommentList.jsx`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/mentions/MentionTextarea.jsx
git commit -m "feat(web): use shared MentionList in MentionTextarea

Fetches members once via the cache hook, filters client-side, anchors
the popup to caret coordinates, adds keyboard nav (arrows/Enter/Tab/Esc)
and mouse-select. Token format unchanged: @[Name](uuid)."
```

---

### Task 6: Wire real popup into `AnnouncementComposer` (TipTap)

**Files:**

- Modify: `apps/web/src/components/announcements/AnnouncementComposer.jsx`

- [ ] **Step 1: Replace the file contents**

```jsx
// apps/web/src/components/announcements/AnnouncementComposer.jsx
'use client';

import { createRef, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import Link from '@tiptap/extension-link';
import { useParams } from 'next/navigation';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import MentionList from '../mentions/MentionList';
import { filterMembers } from '../mentions/filterMembers';
import { useWorkspaceMembers } from '../mentions/useWorkspaceMembers';

export default function AnnouncementComposer({
  open,
  onClose,
  onSubmit,
  initial,
}) {
  const { workspaceId } = useParams();
  const [title, setTitle] = useState(initial?.title || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { members } = useWorkspaceMembers(workspaceId);
  // The TipTap suggestion `items` callback runs outside React's render tree;
  // it reads the current member list synchronously through this ref.
  const membersRef = useRef(members);
  useEffect(() => {
    membersRef.current = members;
  }, [members]);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        link: {
          openOnClick: false,
          HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
        },
      }),
      Mention.configure({
        HTMLAttributes: {
          'data-type': 'mention',
          class:
            'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 px-1 rounded',
        },
        renderHTML: ({ options, node }) => [
          'span',
          {
            ...options.HTMLAttributes,
            'data-id': node.attrs.id,
            'data-label': node.attrs.label,
          },
          `@${node.attrs.label}`,
        ],
        suggestion: {
          char: '@',
          items: ({ query }) => filterMembers(membersRef.current, query),
          render: () => {
            let container = null;
            let root = null;
            const listRef = createRef();

            const draw = (props) => {
              if (!props.clientRect) return;
              const rect = props.clientRect();
              if (!rect) return;
              const position = { top: rect.bottom + 4, left: rect.left };
              root.render(
                <MentionList
                  ref={listRef}
                  items={props.items}
                  loading={false}
                  position={position}
                  onSelect={(m) =>
                    props.command({ id: m.user.id, label: m.user.name })
                  }
                />
              );
            };

            return {
              onStart: (props) => {
                container = document.createElement('div');
                document.body.appendChild(container);
                root = createRoot(container);
                draw(props);
              },
              onUpdate: (props) => {
                draw(props);
              },
              onKeyDown: (props) => {
                if (props.event.key === 'Escape') return false; // let TipTap close
                return listRef.current?.onKeyDown(props.event) ?? false;
              },
              onExit: () => {
                root?.unmount();
                container?.remove();
                root = null;
                container = null;
              },
            };
          },
        },
      }),
    ],
    []
  );

  const editor = useEditor({
    extensions,
    content: initial?.content || '<p></p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'tiptap-editor-content prose prose-sm max-w-none dark:prose-invert focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (open && editor)
      editor.commands.setContent(initial?.content || '<p></p>');
    if (open) setTitle(initial?.title || '');
  }, [open, initial, editor]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({ title: title.trim(), content: editor?.getHTML() || '' });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit announcement' : 'New announcement'}
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Content
          </label>
          <div
            onClick={() => editor?.commands.focus()}
            className="tiptap-editor border border-gray-300 dark:border-gray-700 rounded-md p-3 min-h-[240px] dark:bg-gray-900 cursor-text"
          >
            <EditorContent editor={editor} />
          </div>
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Publish'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 2: Manually verify the announcement surface (popup only — sizing fix lands in Task 7)**

With `npm run dev` running:

1. Open the new-announcement composer (button on the announcements page).
2. Click into the editor and type `@`. **Expected:** the same `MentionList` popup appears just below the caret, listing up to 8 members.
3. Type letters → list filters by prefix-on-any-token.
4. `↓ ↓ Enter` selects a row → a styled mention chip appears in the editor (`<span data-type="mention" data-id=... class="bg-primary-100 ...">@Name</span>`).
5. Click a row with the mouse → same.
6. `Esc` closes the popup.
7. Publish → backend stores the HTML; the recipient gets a `notification:new` for `MENTION` (the existing pipeline in `apps/api/src/controllers/announcements.js` is untouched).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/announcements/AnnouncementComposer.jsx
git commit -m "feat(web): wire real mention popup into TipTap announcement editor

Replaces the no-op render stub with a portal-mounted MentionList that
shares filter, cache, and keyboard nav with the comment textarea.
Bumps editor min-height to 240px and adds click-to-focus on the wrapper."
```

---

### Task 7: Editor sizing CSS (fill ProseMirror, placeholder, focus)

**Files:**

- Create: `apps/web/src/styles/tiptap.css`
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1: Create the stylesheet**

```css
/* apps/web/src/styles/tiptap.css */

/* Make the inner ProseMirror element fill the wrapper so clicking
   anywhere in the box focuses the editor. The wrapper sets min-height;
   ProseMirror inherits it. */
.tiptap-editor .tiptap-editor-content,
.tiptap-editor .ProseMirror {
  min-height: 100%;
  outline: none;
}

/* Reasonable spacing inside the editor without depending on `prose`
   variants that compress empty editors into one visible row. */
.tiptap-editor .ProseMirror p {
  margin: 0 0 0.5em 0;
}
.tiptap-editor .ProseMirror p:last-child {
  margin-bottom: 0;
}

/* Placeholder for empty editors (TipTap's data-placeholder convention). */
.tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  color: rgb(156 163 175); /* gray-400 */
  pointer-events: none;
  float: left;
  height: 0;
}
```

- [ ] **Step 2: Import the stylesheet from `globals.css`**

Edit `apps/web/src/app/globals.css`. Add a single import line near the top, immediately after the Google Fonts import (line 1) and BEFORE the `@tailwind` directives:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap');
@import '../styles/tiptap.css';

@tailwind base;
@tailwind components;
@tailwind utilities;
```

(Order matters: PostCSS requires `@import` rules to come before any other rule, including `@tailwind`.)

- [ ] **Step 3: Manually verify the sizing fix**

With `npm run dev` running:

1. Open the new-announcement composer.
2. **Click near the bottom edge of the editor box** (well below the first text line). **Expected:** editor focuses, cursor appears at the end of the (empty) document. Before this fix, only the top ~24 px was clickable.
3. Tab into the editor or click — confirm the box is visibly ~240 px tall, not ~150.
4. Type two paragraphs separated by Enter. Confirm spacing is comfortable, not crushed.
5. Re-open the composer in edit mode for an existing announcement → content fills, no layout regression.
6. Run a `@`-mention again to confirm the popup still positions correctly with the taller editor.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/styles/tiptap.css apps/web/src/app/globals.css
git commit -m "fix(web): make TipTap editor box fully clickable

Inner ProseMirror now fills the wrapper height, fixes the 'only the
top row is focusable' issue. Adds placeholder styling for empty
editors."
```

---

### Task 8: End-to-end smoke test

**Files:** none — verification only.

- [ ] **Step 1: Run the full smoke checklist from the spec**

With both apps running (`npm run dev`):

1. Announcement composer: `@` shows all members → type `al` filters correctly → `↓ ↓ Enter` selects → chip inserted.
2. Click a row with the mouse → same result.
3. Comments: open an announcement detail → `@` in the comment field → identical popup, identical filtering, identical keyboard nav.
4. Click anywhere in the editor box (top, middle, bottom) → focuses every time.
5. Multi-paragraph announcement → editor grows naturally past 240 px.
6. Submit the announcement with a mention → log in as the mentioned user (or check the DB / bell icon) → notification of type `MENTION` exists.
7. Submit a comment with a mention → same notification path; comment renders the chip via `CommentList.jsx#renderMentions`.
8. Reload the page mid-popup-open → no console errors; popup container is cleaned up (no stray `<div>` left at the end of `<body>`).

- [ ] **Step 2: If everything passes, no further commit is needed**

Notify the user the feature is shipped and ready for review. If anything fails in the smoke test, fix it in a small follow-up commit before declaring done.

---

## Notes for the implementer

- **No new dependencies.** TipTap and `@tiptap/suggestion` are already installed; everything else is plain React + DOM.
- **Backend is untouched.** Mention extraction (`apps/api/src/lib/mentions.js`), HTML sanitization (`apps/api/src/lib/sanitize.js`), and notifications (`apps/api/src/lib/notifications.js`) already work correctly with the formats this plan emits (`<span data-type="mention" data-id=...>` for HTML, `@[Name](uuid)` for plaintext).
- **Why `mousedown` not `click` in `MentionList`** — clicking a popup row would otherwise blur the textarea (which closes the popup) before the click registers.
- **Why `requestAnimationFrame`** — `selectionStart` reads from the DOM after the input event; we defer to the next frame to read the post-change caret position.
- **Path alias** — `@/lib/api` resolves to `apps/web/src/lib/api.js` via `jsconfig.json`.
- **Tailwind primary scale** — `bg-primary-100`, `bg-primary-50`, `bg-primary-900/30` are defined in `apps/web/tailwind.config.js`. Don't substitute hex values.
