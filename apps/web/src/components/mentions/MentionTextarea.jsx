'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

/**
 * Plain-text textarea with @-mention typeahead. Emits the value as
 * markdown-style tokens: "Hi @[Alice Smith](user-id-uuid)".
 *
 * Used by comments and the goal activity composer (Phase 5 will hook into
 * this for goal updates). The TipTap editor handles announcement bodies
 * with its own mention extension.
 */
export default function MentionTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}) {
  const { workspaceId } = useParams();
  const ref = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showAt, setShowAt] = useState(null);

  useEffect(() => {
    if (!showAt) {
      setSuggestions([]);
      return;
    }
    const term = value.slice(showAt.start + 1, showAt.caret);
    let cancelled = false;
    api
      .get(
        `/api/workspaces/${workspaceId}/members?search=${encodeURIComponent(term)}`
      )
      .then((r) => {
        if (!cancelled) setSuggestions((r.members || []).slice(0, 5));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [value, showAt, workspaceId]);

  const onKeyUp = (e) => {
    const caret = e.target.selectionStart;
    const before = value.slice(0, caret);
    const at = before.lastIndexOf('@');
    if (at < 0 || /\s/.test(before.slice(at + 1))) {
      setShowAt(null);
      return;
    }
    setShowAt({ start: at, caret });
  };

  const insertMention = (member) => {
    if (!showAt) return;
    const token = `@[${member.user.name}](${member.user.id})`;
    const next =
      value.slice(0, showAt.start) + token + value.slice(showAt.caret);
    onChange(next);
    setShowAt(null);
    setTimeout(() => ref.current?.focus(), 0);
  };

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyUp={onKeyUp}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900 dark:text-white text-sm"
      />
      {showAt && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
          {suggestions.map((m) => (
            <button
              key={m.user.id}
              onClick={() => insertMention(m)}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <span className="font-medium">{m.user.name}</span>
              <span className="ml-2 text-xs text-gray-500">{m.user.email}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
