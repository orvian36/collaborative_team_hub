'use client';

import { useState } from 'react';
import RichTextRenderer from './RichTextRenderer';
import ReactionBar from './ReactionBar';
import CommentList from './CommentList';
import Button from '../ui/Button';
import { CAPABILITIES } from '@team-hub/shared';
import { useCapability } from '@/hooks/useCapability';

export default function AnnouncementCard({
  announcement,
  onTogglePin,
  onEdit,
  onDelete,
}) {
  const canPin = useCapability(CAPABILITIES.ANNOUNCEMENT_PIN);
  const canEdit = useCapability(CAPABILITIES.ANNOUNCEMENT_EDIT);
  const canDelete = useCapability(CAPABILITIES.ANNOUNCEMENT_DELETE);
  const [showComments, setShowComments] = useState(false);

  const commentCount = announcement._count?.comments || 0;

  return (
    <article
      className={`relative rounded-2xl border bg-[color:var(--surface)] p-5 transition-colors ${
        announcement.isPinned
          ? 'border-primary-500/40'
          : 'border-line'
      }`}
    >
      {announcement.isPinned && (
        <div className="absolute -top-2 left-5">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-600 text-white text-[10px] font-semibold px-2 py-0.5 uppercase tracking-wider shadow-soft">
            <PinIcon className="w-2.5 h-2.5" />
            Pinned
          </span>
        </div>
      )}
      <header className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold tracking-tight text-fg">
            {announcement.title}
          </h2>
          <div className="flex items-center gap-2 text-xs text-muted mt-1.5">
            {announcement.author?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={announcement.author.avatarUrl}
                alt=""
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/40 grid place-items-center text-[9px] font-semibold text-primary-700 dark:text-primary-300">
                {(announcement.author?.name?.[0] || '?').toUpperCase()}
              </span>
            )}
            <span className="font-medium text-fg">
              {announcement.author?.name}
            </span>
            <span className="text-subtle">·</span>
            <time className="text-subtle">
              {new Date(announcement.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {canPin && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onTogglePin(announcement.id)}
            >
              {announcement.isPinned ? 'Unpin' : 'Pin'}
            </Button>
          )}
          {canEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(announcement)}
            >
              Edit
            </Button>
          )}
          {canDelete && (
            <Button
              size="sm"
              variant="ghost"
              className="text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
              onClick={() => onDelete(announcement.id)}
            >
              Delete
            </Button>
          )}
        </div>
      </header>

      <div className="mb-4 prose prose-sm max-w-none dark:prose-invert text-fg">
        <RichTextRenderer html={announcement.content} />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-line">
        <ReactionBar announcementId={announcement.id} />
        <button
          type="button"
          onClick={() => setShowComments(!showComments)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-fg transition-colors"
        >
          <CommentIcon className="w-3.5 h-3.5" />
          {commentCount} comment{commentCount === 1 ? '' : 's'}
        </button>
      </div>

      {showComments && (
        <div className="border-t border-line mt-4 pt-4">
          <CommentList announcementId={announcement.id} />
        </div>
      )}
    </article>
  );
}

function PinIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M5 1h2l1 4 2 1v1H7l-1 5-1-5H2V6l2-1 1-4z" />
    </svg>
  );
}
function CommentIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M3 4.5C3 3.7 3.7 3 4.5 3h7C12.3 3 13 3.7 13 4.5V10c0 .8-.7 1.5-1.5 1.5H7L4 14v-2.5c-.6 0-1-.5-1-1V4.5z" />
    </svg>
  );
}
