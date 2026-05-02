'use client';

import { useParams } from 'next/navigation';
import useReactionsStore from '@/stores/reactionsStore';
import useAuthStore from '@/stores/authStore';
import { CAPABILITIES } from '@team-hub/shared';
import { useCapability } from '@/hooks/useCapability';

const PALETTE = ['👍', '🎉', '❤️', '🚀', '👀', '😄'];

export default function ReactionBar({ announcementId }) {
  const { workspaceId } = useParams();
  const { byAnnouncementId, toggle } = useReactionsStore();
  const reactions = byAnnouncementId[announcementId] || [];
  const { user } = useAuthStore();
  const canReact = useCapability(CAPABILITIES.REACTION_TOGGLE);

  const counts = {};
  const mineByEmoji = new Set();
  for (const r of reactions) {
    counts[r.emoji] = (counts[r.emoji] || 0) + 1;
    if (r.userId === user?.id) mineByEmoji.add(r.emoji);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PALETTE.map((emoji) => {
        const count = counts[emoji] || 0;
        const mine = mineByEmoji.has(emoji);
        return (
          <button
            key={emoji}
            disabled={!canReact}
            onClick={() => toggle(workspaceId, announcementId, emoji, user?.id)}
            className={`px-2 py-1 text-sm rounded-full border transition-colors ${
              mine
                ? 'bg-primary-100 dark:bg-primary-900/40 border-primary-300 dark:border-primary-700'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
            } ${!canReact ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span>{emoji}</span>
            {count > 0 && <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
