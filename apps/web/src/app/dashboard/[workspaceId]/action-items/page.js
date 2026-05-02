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
  const { fetchAll, isLoading, create, update } = useActionItemsStore();
  const canCreate = useCapability(CAPABILITIES.ACTION_ITEM_CREATE);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => { fetchAll(workspaceId); }, [workspaceId, fetchAll]);

  useEffect(() => {
    if (params.get('new') === '1') {
      setEditing(null);
      setOpen(true);
    }
  }, [params]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Action items</h1>
        <div className="flex items-center gap-3">
          <ViewToggle value={view} />
          {canCreate && <Button onClick={() => { setEditing(null); setOpen(true); }}>New action item</Button>}
        </div>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading…</p>
      ) : view === 'kanban' ? (
        <KanbanBoard onCardClick={(it) => { setEditing(it); setOpen(true); }} />
      ) : (
        <ActionItemList onEdit={(it) => { setEditing(it); setOpen(true); }} />
      )}

      <ActionItemFormModal
        open={open}
        onClose={() => { setOpen(false); setEditing(null); }}
        initial={editing}
        workspaceId={workspaceId}
        onSubmit={async (data) => {
          if (editing) await update(workspaceId, editing.id, data);
          else await create(workspaceId, data);
        }}
      />
    </div>
  );
}
