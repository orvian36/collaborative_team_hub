'use client';

import { useState } from 'react';
import { CAPABILITIES } from '@team-hub/shared';
import { useCapability } from '@/hooks/useCapability';
import Button from '../ui/Button';

export default function MilestoneList({
  milestones,
  onCreate,
  onUpdate,
  onRemove,
}) {
  const canWrite = useCapability(CAPABILITIES.MILESTONE_WRITE);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onCreate({ title: title.trim(), progress: 0 });
    setTitle('');
    setAdding(false);
  };

  return (
    <div className="bg-[color:var(--surface)] border border-line rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-line flex items-center justify-between bg-[color:var(--surface-2)]/30">
        <div>
          <h3 className="font-semibold text-fg">Milestones</h3>
          <p className="text-xs text-muted mt-0.5">Track key steps toward this goal</p>
        </div>
        {canWrite && !adding && (
          <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
            Add step
          </Button>
        )}
      </div>

      <div className="p-5">
        {adding && (
          <form onSubmit={submit} className="flex gap-2 mb-6 p-4 rounded-lg bg-[color:var(--surface-2)] border border-line shadow-sm">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              placeholder="e.g., Complete user research"
              className="flex-1 px-3 py-1.5 border border-line rounded-md bg-[color:var(--bg)] text-fg text-sm focus-ring"
            />
            <Button size="sm" type="submit">
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => {
                setAdding(false);
                setTitle('');
              }}
            >
              Cancel
            </Button>
          </form>
        )}

        {milestones.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted">No milestones defined yet.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {milestones.map((m) => {
              const isCompleted = m.progress === 100;
              return (
                <li 
                  key={m.id} 
                  className={`group p-4 rounded-xl border transition-all ${
                    isCompleted 
                      ? 'bg-emerald-50/30 dark:bg-emerald-500/5 border-emerald-200/50 dark:border-emerald-500/20' 
                      : 'bg-[color:var(--surface-2)] border-line hover:border-line-strong'
                  }`}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      disabled={!canWrite}
                      onChange={(e) => onUpdate(m.id, { progress: e.target.checked ? 100 : 0 })}
                      className="w-4 h-4 rounded border-line text-primary-600 focus:ring-primary-500 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium truncate ${isCompleted ? 'text-fg line-through opacity-60' : 'text-fg'}`}>
                          {m.title}
                        </span>
                        {isCompleted && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                    {canWrite && (
                      <button
                        onClick={() => onRemove(m.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all"
                        title="Remove milestone"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  <div className="pl-8 flex items-center gap-4">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={m.progress}
                      disabled={!canWrite}
                      onChange={(e) => onUpdate(m.id, { progress: Number(e.target.value) })}
                      className="flex-1 accent-primary-500 disabled:opacity-30 h-1.5 cursor-pointer bg-[color:var(--surface-3)] rounded-full appearance-none"
                    />
                    <span className="w-8 text-[11px] font-mono text-muted text-right">
                      {m.progress}%
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
