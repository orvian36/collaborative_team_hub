'use client';

import { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from '@dnd-kit/core';
import { useParams } from 'next/navigation';
import useActionItemsStore from '@/stores/actionItemsStore';
import { ACTION_ITEM_STATUS } from '@team-hub/shared';
import KanbanColumn from './KanbanColumn';
import ActionItemCard from './ActionItemCard';

export default function KanbanBoard({ onCardClick }) {
  const { workspaceId } = useParams();
  const { byStatus, move } = useActionItemsStore();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  const [active, setActive] = useState(null);

  const columns = [
    ACTION_ITEM_STATUS.TODO,
    ACTION_ITEM_STATUS.IN_PROGRESS,
    ACTION_ITEM_STATUS.DONE,
  ];

  const findContainer = (id) => {
    if (columns.includes(id)) return id;
    for (const k of columns) {
      if ((byStatus[k] || []).some((it) => it.id === id)) return k;
    }
    return null;
  };

  const onDragStart = (e) => {
    const fromCol = findContainer(e.active.id);
    if (fromCol) {
      const item = byStatus[fromCol].find((i) => i.id === e.active.id);
      setActive(item);
    }
  };

  const onDragOver = (e) => {
    const { active: a, over } = e;
    if (!over) return;

    const fromCol = findContainer(a.id);
    const toCol = findContainer(over.id);

    if (!fromCol || !toCol || fromCol === toCol) return;

    // We don't call the API here, just update local state if we want visual jumping.
    // However, since we are using SortableContext with items from store, 
    // updating store here might be jittery if we don't handle it carefully.
    // For now, onDragEnd is sufficient for persistence, but let's ensure it's reliable.
  };

  const onDragEnd = async (e) => {
    setActive(null);
    const { active: a, over } = e;
    if (!over) return;

    const fromCol = findContainer(a.id);
    const toCol = findContainer(over.id);

    if (!fromCol || !toCol) return;

    if (a.id === over.id && fromCol === toCol) return;

    const list = byStatus[toCol] || [];
    let toIndex = list.findIndex((i) => i.id === over.id);
    if (toIndex < 0) toIndex = list.length;

    try {
      await move(workspaceId, a.id, toCol, toIndex);
    } catch (err) {
      console.error('Move error:', err);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto">
        {columns.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            items={byStatus[status] || []}
            onCardClick={onCardClick}
          />
        ))}
      </div>
      <DragOverlay>
        {active ? <ActionItemCard item={active} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
