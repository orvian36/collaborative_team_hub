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
