'use client';

import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import AccentColorPicker from './AccentColorPicker';

export default function CreateWorkspaceModal({ open, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [accentColor, setAccentColor] = useState('#3b82f6');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName(''); setDescription(''); setAccentColor('#3b82f6'); setError(''); setSubmitting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setSubmitting(true); setError('');
    try {
      await onCreate({ name: name.trim(), description: description.trim() || undefined, accentColor });
      reset();
    } catch (err) {
      setError(err.message || 'Failed to create workspace');
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => { if (!submitting) { reset(); onClose(); } }}
      title="Create workspace"
      footer={
        <>
          <Button variant="secondary" onClick={() => { reset(); onClose(); }} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 dark:text-white"
            placeholder="Engineering"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 dark:text-white"
            placeholder="What does this workspace do?"
          />
        </div>
        <AccentColorPicker value={accentColor} onChange={setAccentColor} />
      </form>
    </Modal>
  );
}
