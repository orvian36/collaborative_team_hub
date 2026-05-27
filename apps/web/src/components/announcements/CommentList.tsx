'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import useCommentsStore from '@/stores/commentsStore';
import useAuthStore from '@/stores/authStore';
import { CAPABILITIES } from '@team-hub/shared';
import { useCapability } from '@/hooks/useCapability';
import MentionTextarea from '@/components/mentions/MentionTextarea';
import Button from '../ui/Button';

export default function CommentList({ announcementId }) {
  const { workspaceId } = useParams();
  const { byAnnouncementId, fetchFor, add, remove } = useCommentsStore();
  const { user } = useAuthStore();
  const canComment = useCapability(CAPABILITIES.COMMENT_CREATE);
  const canDeleteAny = useCapability(CAPABILITIES.COMMENT_DELETE_ANY);
  const canDeleteOwn = useCapability(CAPABILITIES.COMMENT_DELETE_OWN);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const comments = byAnnouncementId[announcementId] || [];

  useEffect(() => {
    fetchFor(workspaceId, announcementId);
  }, [workspaceId, announcementId, fetchFor]);

  const submit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await add(workspaceId, announcementId, content.trim());
      setContent('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {comments.map((c) => {
          const canDelete =
            canDeleteAny || (canDeleteOwn && c.authorId === user?.id);
          return (
            <li key={c.id} className="flex gap-3">
              {c.author?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.author.avatarUrl}
                  alt=""
                  className="w-7 h-7 rounded-full mt-0.5 flex-shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gray-300 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {c.author?.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(c.createdAt).toLocaleString()}
                  </span>
                  {canDelete && (
                    <button
                      onClick={() => remove(workspaceId, announcementId, c.id)}
                      className="text-xs text-red-600 hover:underline ml-auto"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {renderMentions(c.content)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      {canComment && (
        <form onSubmit={submit} className="flex flex-col gap-2">
          <MentionTextarea
            value={content}
            onChange={setContent}
            placeholder="Add a comment… (use @ to mention)"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !content.trim()}
            >
              {submitting ? 'Posting…' : 'Post comment'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function renderMentions(text) {
  // Replaces @[Name](id) tokens with styled inline spans for display.
  const parts = [];
  const re = /@\[([^\]]+)\]\(([a-f0-9-]{36})\)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <span
        key={m.index}
        className="bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 px-1 rounded"
      >
        @{m[1]}
      </span>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
