'use client';

import { useState } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter, DragOverlay } from '@dnd-kit/core';
import { useParams } from 'next/navigation';
import useActionItemsStore from '@/stores/actionItemsStore';
import { ACTION_ITEM_STATUS } from '@team-hub/shared';
import KanbanColumn from './KanbanColumn';
import ActionItemCard from './ActionItemCard';

export default function KanbanBoard({ onCardClick }) {
  const { workspaceId } = useParams();
  const { byStatus, move } = useActionItemsStore();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [active, setActive] = useState(null);

  const columns = [ACTION_ITEM_STATUS.TODO, ACTION_ITEM_STATUS.IN_PROGRESS, ACTION_ITEM_STATUS.DONE];

  const findContainer = (id) => {
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

  const onDragEnd = async (e) => {
    setActive(null);
    const { active: a, over } = e;
    if (!over) return;
    const fromCol = findContainer(a.id);
    let toCol = findContainer(over.id);
    let toIndex = 0;
    if (toCol) {
      const list = byStatus[toCol];
      toIndex = list.findIndex((i) => i.id === over.id);
      if (toIndex < 0) toIndex = list.length;
    } else if (columns.includes(over.id)) {
      // dropped on empty column area
      toCol = over.id;
      toIndex = (byStatus[toCol] || []).length;
    }
    if (!toCol) return;
    if (a.id === over.id && fromCol === toCol) return;
    try {
      await move(workspaceId, a.id, toCol, toIndex);
    } catch (err) {
      alert(err.message || 'Failed to move card');
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto">
        {columns.map((status) => (
          <KanbanColumn key={status} status={status} items={byStatus[status] || []} onCardClick={onCardClick} />
        ))}
      </div>
      <DragOverlay>
        {active ? <ActionItemCard item={active} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
