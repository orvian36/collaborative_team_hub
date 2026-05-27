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
