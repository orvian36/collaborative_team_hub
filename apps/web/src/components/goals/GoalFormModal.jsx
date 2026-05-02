'use client';

import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { GOAL_STATUS } from '@team-hub/shared';
import useWorkspaceMembersStore from '@/stores/workspaceMembersStore';

export default function GoalFormModal({ open, onClose, onSubmit, initial, workspaceId }) {
  const { members, fetchMembers } = useWorkspaceMembersStore();
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [ownerId, setOwnerId] = useState(initial?.ownerId || '');
  const [dueDate, setDueDate] = useState(initial?.dueDate ? initial.dueDate.slice(0, 10) : '');
  const [status, setStatus] = useState(initial?.status || GOAL_STATUS.NOT_STARTED);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) fetchMembers(workspaceId);
  }, [open, workspaceId, fetchMembers]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        ownerId: ownerId || undefined,
        dueDate: dueDate || null,
        status,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save goal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit goal' : 'New goal'}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-bg-gray-900 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900 dark:text-white" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Owner</label>
            <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900 dark:text-white">
              <option value="">(myself)</option>
              {members.map((m) => (
                <option key={m.id} value={m.user.id}>{m.user.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900 dark:text-white" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900 dark:text-white">
            <option value={GOAL_STATUS.NOT_STARTED}>Not started</option>
            <option value={GOAL_STATUS.IN_PROGRESS}>In progress</option>
            <option value={GOAL_STATUS.COMPLETED}>Completed</option>
          </select>
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
