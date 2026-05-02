'use client';

import { useState } from 'react';
import { CAPABILITIES } from '@team-hub/shared';
import { useCapability } from '@/hooks/useCapability';
import Button from '../ui/Button';

export default function MilestoneList({ milestones, onCreate, onUpdate, onRemove }) {
  const canWrite = useCapability(CAPABILITIES.MILESTONE_WRITE);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onCreate({ title: title.trim(), progress: 0 });
    setTitle(''); setAdding(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">Milestones</h3>
        {canWrite && !adding && (
          <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>Add milestone</Button>
        )}
      </div>

      {adding && (
        <form onSubmit={submit} className="flex gap-2 mb-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            placeholder="Milestone title"
            className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900 dark:text-white text-sm"
          />
          <Button size="sm" type="submit">Add</Button>
          <Button size="sm" variant="outline" type="button" onClick={() => { setAdding(false); setTitle(''); }}>Cancel</Button>
        </form>
      )}

      {milestones.length === 0 ? (
        <p className="text-sm text-gray-500">No milestones yet.</p>
      ) : (
        <ul className="space-y-2">
          {milestones.map((m) => (
            <li key={m.id} className="flex items-center gap-3">
              <span className="flex-1 text-sm text-gray-900 dark:text-gray-100">{m.title}</span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={m.progress}
                disabled={!canWrite}
                onChange={(e) => onUpdate(m.id, { progress: Number(e.target.value) })}
                className="w-32 disabled:opacity-50"
              />
              <span className="w-12 text-xs text-right text-gray-500">{m.progress}%</span>
              {canWrite && (
                <button
                  onClick={() => onRemove(m.id)}
                  className="text-xs text-red-600 hover:underline"
                >Remove</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
