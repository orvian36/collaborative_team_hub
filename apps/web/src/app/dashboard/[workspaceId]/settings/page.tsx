'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useWorkspaceStore from '@/stores/workspaceStore';
import AccentColorPicker from '@/components/workspace/AccentColorPicker';
import WorkspaceIconUpload from '@/components/workspace/WorkspaceIconUpload';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function WorkspaceSettings() {
  const router = useRouter();
  const { workspaceId } = useParams();
  const { workspaces, updateWorkspace, uploadWorkspaceIcon, deleteWorkspace } =
    useWorkspaceStore();
  const workspace = workspaces.find((w) => w.id === workspaceId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [accentColor, setAccentColor] = useState('#3b82f6');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (workspace) {
      setName(workspace.name);
      setDescription(workspace.description || '');
      setAccentColor(workspace.accentColor);
    }
  }, [workspace]);

  if (!workspace) return null;
  if (workspace.myRole !== 'ADMIN') {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <p className="text-gray-600 dark:text-gray-300">
          Only admins can edit workspace settings.
        </p>
      </div>
    );
  }

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateWorkspace(workspace.id, {
        name: name.trim(),
        description,
        accentColor,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Workspace icon
        </h2>
        <WorkspaceIconUpload
          workspace={workspace}
          onUpload={(file) => uploadWorkspaceIcon(workspace.id, file)}
        />
      </section>

      <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          General
        </h2>
        <form onSubmit={onSave} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 dark:text-white"
            />
          </div>
          <AccentColorPicker value={accentColor} onChange={setAccentColor} />
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </section>

      <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-red-200 dark:border-red-900">
        <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
          Danger zone
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Deleting a workspace is permanent. All goals, announcements, and
          members will be removed.
        </p>
        <Button variant="danger" onClick={() => setConfirmDelete(true)}>
          Delete workspace
        </Button>
        <ConfirmDialog
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          onConfirm={async () => {
            setDeleting(true);
            try {
              await deleteWorkspace(workspace.id);
              router.replace('/dashboard');
            } finally {
              setDeleting(false);
              setConfirmDelete(false);
            }
          }}
          title={`Delete "${workspace.name}"?`}
          message="This cannot be undone."
          confirmLabel="Delete forever"
          isLoading={deleting}
        />
      </section>
    </div>
  );
}
