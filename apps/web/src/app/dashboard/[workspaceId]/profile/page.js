'use client';

import { useState } from 'react';
import useAuthStore from '@/stores/authStore';
import AvatarUpload from '@/components/profile/AvatarUpload';
import Button from '@/components/ui/Button';

export default function ProfilePage() {
  const { user, updateProfile, isLoading } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [msg, setMsg] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    const r = await updateProfile({
      name: name !== user?.name ? name : undefined,
      avatarFile,
    });
    setMsg(r.success ? 'Saved.' : `Error: ${r.error}`);
    if (r.success) setAvatarFile(null);
  };

  if (!user) return null;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Your profile
      </h1>
      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Avatar
          </label>
          <AvatarUpload currentUrl={user.avatarUrl} onSelect={setAvatarFile} />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900 dark:text-white"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <input
            value={user.email}
            readOnly
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 text-gray-500 rounded-md"
          />
        </div>
        {msg && (
          <p className="text-sm text-gray-700 dark:text-gray-300">{msg}</p>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving…' : 'Save changes'}
        </Button>
      </form>
    </div>
  );
}
