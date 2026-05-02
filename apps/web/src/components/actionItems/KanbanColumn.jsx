'use client';

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import ActionItemCard from './ActionItemCard';

const TITLES = { TODO: 'To do', IN_PROGRESS: 'In progress', DONE: 'Done' };

function SortableCard({ item, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ActionItemCard item={item} onClick={onClick} />
    </div>
  );
}

export default function KanbanColumn({ status, items, onCardClick }) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className="flex-1 min-w-[260px] bg-gray-100 dark:bg-gray-900/50 rounded-lg p-3"
    >
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        {TITLES[status] || status}{' '}
        <span className="text-xs text-gray-500">({items.length})</span>
      </h3>
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 min-h-[40px]">
          {items.map((it) => (
            <SortableCard
              key={it.id}
              item={it}
              onClick={() => onCardClick(it)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
