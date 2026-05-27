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
const DOTS = {
  TODO: 'bg-ink-400',
  IN_PROGRESS: 'bg-primary-500',
  DONE: 'bg-emerald-500',
};

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
      className="flex-1 min-w-[280px] rounded-2xl border border-line bg-[color:var(--surface-2)] p-3"
    >
      <header className="flex items-center justify-between px-1.5 mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-fg flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${DOTS[status]}`} />
          {TITLES[status] || status}
        </h3>
        <span className="text-[11px] font-mono text-subtle">
          {items.length}
        </span>
      </header>
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 min-h-[40px]">
          {items.length === 0 && (
            <div className="text-xs text-subtle text-center py-4">
              Drop items here
            </div>
          )}
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
