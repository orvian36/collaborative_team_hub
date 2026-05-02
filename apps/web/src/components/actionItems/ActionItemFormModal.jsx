'use client';

import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { ACTION_ITEM_STATUS, PRIORITY } from '@team-hub/shared';
import useWorkspaceMembersStore from '@/stores/workspaceMembersStore';
import useGoalsStore from '@/stores/goalsStore';

export default function ActionItemFormModal({ open, onClose, onSubmit, initial, workspaceId }) {
  const { members, fetchMembers } = useWorkspaceMembersStore();
  const { goals, fetchGoals } = useGoalsStore();
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [priority, setPriority] = useState(initial?.priority || PRIORITY.MEDIUM);
  const [status, setStatus] = useState(initial?.status || ACTION_ITEM_STATUS.TODO);
  const [dueDate, setDueDate] = useState(initial?.dueDate ? initial.dueDate.slice(0, 10) : '');
  const [assigneeId, setAssigneeId] = useState(initial?.assigneeId || '');
  const [goalId, setGoalId] = useState(initial?.goalId || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      fetchMembers(workspaceId);
      fetchGoals(workspaceId);
    }
  }, [open, workspaceId, fetchMembers, fetchGoals]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status: initial ? undefined : status,
        dueDate: dueDate || null,
        assigneeId: assigneeId || null,
        goalId: goalId || null,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit action item' : 'New action item'}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900 dark:text-white" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assignee</label>
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900 dark:text-white">
              <option value="">(unassigned)</option>
              {members.map((m) => <option key={m.id} value={m.user.id}>{m.user.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Linked goal</label>
            <select value={goalId} onChange={(e) => setGoalId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900 dark:text-white">
              <option value="">(none)</option>
              {goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900 dark:text-white">
              {Object.values(PRIORITY).map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {!initial && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900 dark:text-white">
                {Object.values(ACTION_ITEM_STATUS).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900 dark:text-white" />
          </div>
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</Button>
        </div>
      </form>
    </Modal>
  );
}
