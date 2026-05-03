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
