'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
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
  const {
    announcements,
    isLoading,
    fetchAll,
    create,
    update,
    remove,
    togglePin,
  } = useAnnouncementsStore();
  const { setForAnnouncement } = useReactionsStore();
  const canCreate = useCapability(CAPABILITIES.ANNOUNCEMENT_CREATE);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchAll(workspaceId);
  }, [workspaceId, fetchAll]);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditing(null);
      setComposerOpen(true);
    }
  }, [searchParams]);

  // Hydrate reactions per visible announcement (one extra request each).
  useEffect(() => {
    for (const a of announcements) {
      api
        .get(`/api/workspaces/${workspaceId}/announcements/${a.id}`)
        .then(({ announcement }) => {
          setForAnnouncement(a.id, announcement.reactions || []);
        })
        .catch(() => {});
    }
  }, [announcements, workspaceId, setForAnnouncement]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-subtle font-semibold">
            Context, broadcast once
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-fg mt-1">
            Announcements
          </h1>
        </div>
        {canCreate && (
          <Button
            variant="contrast"
            onClick={() => {
              setEditing(null);
              setComposerOpen(true);
            }}
          >
            New announcement
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-2xl border border-line bg-[color:var(--surface-2)]"
            />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-[color:var(--surface)] py-16 px-6 text-center">
          <p className="text-sm text-muted">No announcements yet.</p>
          {canCreate && (
            <div className="mt-4">
              <Button
                variant="contrast"
                onClick={() => {
                  setEditing(null);
                  setComposerOpen(true);
                }}
              >
                Post the first one
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              onTogglePin={(id) => togglePin(workspaceId, id)}
              onEdit={(item) => {
                setEditing(item);
                setComposerOpen(true);
              }}
              onDelete={(id) => setConfirmDelete(id)}
            />
          ))}
        </div>
      )}

      <AnnouncementComposer
        open={composerOpen}
        onClose={() => {
          setComposerOpen(false);
          setEditing(null);
        }}
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
