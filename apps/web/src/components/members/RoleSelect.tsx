'use client';

import { useState } from 'react';
import { ROLES } from '@team-hub/shared';

export default function RoleSelect({ value, onChange, disabled }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handle = async (e) => {
    const next = e.target.value;
    setBusy(true);
    setError('');
    try {
      await onChange(next);
    } catch (err) {
      setError(err.message || 'Failed to update role');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <select
        value={value}
        onChange={handle}
        disabled={disabled || busy}
        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 dark:text-white disabled:opacity-50"
      >
        <option value={ROLES.ADMIN}>ADMIN</option>
        <option value={ROLES.MEMBER}>MEMBER</option>
      </select>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
