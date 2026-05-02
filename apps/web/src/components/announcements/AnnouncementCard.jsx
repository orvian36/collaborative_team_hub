'use client';

import { useState } from 'react';
import RichTextRenderer from './RichTextRenderer';
import ReactionBar from './ReactionBar';
import CommentList from './CommentList';
import Button from '../ui/Button';
import { CAPABILITIES } from '@team-hub/shared';
import { useCapability } from '@/hooks/useCapability';

export default function AnnouncementCard({ announcement, onTogglePin, onEdit, onDelete }) {
  const canPin    = useCapability(CAPABILITIES.ANNOUNCEMENT_PIN);
  const canEdit   = useCapability(CAPABILITIES.ANNOUNCEMENT_EDIT);
  const canDelete = useCapability(CAPABILITIES.ANNOUNCEMENT_DELETE);
  const [showComments, setShowComments] = useState(false);

  return (
    <article className={`bg-white dark:bg-gray-800 border rounded-lg p-5 ${
      announcement.isPinned ? 'border-primary-300 dark:border-primary-700' : 'border-gray-200 dark:border-gray-700'
    }`}>
      <header className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{announcement.title}</h2>
            {announcement.isPinned && (
              <span className="text-xs bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">Pinned</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {announcement.author?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={announcement.author.avatarUrl} alt="" className="w-5 h-5 rounded-full" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gray-300" />
            )}
            <span>{announcement.author?.name}</span>
            <span>· {new Date(announcement.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {canPin    && <Button size="sm" variant="outline" onClick={() => onTogglePin(announcement.id)}>{announcement.isPinned ? 'Unpin' : 'Pin'}</Button>}
          {canEdit   && <Button size="sm" variant="outline" onClick={() => onEdit(announcement)}>Edit</Button>}
          {canDelete && <Button size="sm" variant="outline" onClick={() => onDelete(announcement.id)}>Delete</Button>}
        </div>
      </header>

      <div className="mb-4">
        <RichTextRenderer html={announcement.content} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <ReactionBar announcementId={announcement.id} />
        <button onClick={() => setShowComments(!showComments)} className="text-sm text-primary-600 hover:underline">
          {announcement._count?.comments || 0} comment{(announcement._count?.comments || 0) === 1 ? '' : 's'}
        </button>
      </div>

      {showComments && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          <CommentList announcementId={announcement.id} />
        </div>
      )}
    </article>
  );
}
