'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CAPABILITIES } from '@team-hub/shared';
import useActionItemsStore from '@/stores/actionItemsStore';
import { useCapability } from '@/hooks/useCapability';
import KanbanBoard from '@/components/actionItems/KanbanBoard';
import ActionItemList from '@/components/actionItems/ActionItemList';
import ActionItemFormModal from '@/components/actionItems/ActionItemFormModal';
import ViewToggle from '@/components/actionItems/ViewToggle';
import Button from '@/components/ui/Button';

export default function ActionItemsPage() {
  const { workspaceId } = useParams();
  const params = useSearchParams();
  const view = params.get('view') === 'list' ? 'list' : 'kanban';
  const { fetchAll, isLoading, create, update, remove } = useActionItemsStore();
  const canCreate = useCapability(CAPABILITIES.ACTION_ITEM_CREATE);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    fetchAll(workspaceId);
  }, [workspaceId, fetchAll]);

  useEffect(() => {
    if (params.get('new') === '1') {
      setEditing(null);
      setOpen(true);
    }
  }, [params]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-subtle font-semibold">
            The work itself
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-fg mt-1">
            Action items
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle value={view} />
          {canCreate && (
            <Button
              variant="contrast"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              New action item
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-72 rounded-2xl border border-line bg-[color:var(--surface-2)]"
            />
          ))}
        </div>
      ) : view === 'kanban' ? (
        <KanbanBoard
          onCardClick={(it) => {
            setEditing(it);
            setOpen(true);
          }}
        />
      ) : (
        <ActionItemList
          onEdit={(it) => {
            setEditing(it);
            setOpen(true);
          }}
        />
      )}

      <ActionItemFormModal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        initial={editing}
        workspaceId={workspaceId}
        onSubmit={async (data) => {
          if (editing) await update(workspaceId, editing.id, data);
          else await create(workspaceId, data);
        }}
        onDelete={async () => {
          if (editing) await remove(workspaceId, editing.id);
        }}
      />
    </div>
  );
}
