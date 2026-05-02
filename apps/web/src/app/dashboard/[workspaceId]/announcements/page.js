'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CAPABILITIES } from '@team-hub/shared';
import useAnnouncementsStore from '@/stores/announcementsStore';
import useReactionsStore from '@/stores/reactionsStore';
import { useCapability } from '@/hooks/useCapability';
import AnnouncementCard from '@/components/announcements/AnnouncementCard';
import AnnouncementComposer from '@/components/announcements/AnnouncementComposer';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';

export default function AnnouncementsPage() {
  const { workspaceId } = useParams();
  const { announcements, isLoading, fetchAll, create, update, remove, togglePin } = useAnnouncementsStore();
  const { setForAnnouncement } = useReactionsStore();
  const canCreate = useCapability(CAPABILITIES.ANNOUNCEMENT_CREATE);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchAll(workspaceId);
  }, [workspaceId, fetchAll]);

  // Hydrate reactions per visible announcement (one extra request each).
  useEffect(() => {
    for (const a of announcements) {
      api.get(`/api/workspaces/${workspaceId}/announcements/${a.id}`).then(({ announcement }) => {
        setForAnnouncement(a.id, announcement.reactions || []);
      }).catch(() => {});
    }
  }, [announcements, workspaceId, setForAnnouncement]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</h1>
        {canCreate && (
          <Button onClick={() => { setEditing(null); setComposerOpen(true); }}>New announcement</Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading…</p>
      ) : announcements.length === 0 ? (
        <p className="text-gray-500">No announcements yet.</p>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              onTogglePin={(id) => togglePin(workspaceId, id)}
              onEdit={(item) => { setEditing(item); setComposerOpen(true); }}
              onDelete={(id) => setConfirmDelete(id)}
            />
          ))}
        </div>
      )}

      <AnnouncementComposer
        open={composerOpen}
        onClose={() => { setComposerOpen(false); setEditing(null); }}
        initial={editing}
        onSubmit={async (data) => {
          if (editing) await update(workspaceId, editing.id, data);
          else await create(workspaceId, data);
        }}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete this announcement?"
        description="This removes the post and all comments + reactions. Cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          await remove(workspaceId, confirmDelete);
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}
