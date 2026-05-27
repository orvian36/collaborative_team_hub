'use client';

import { useState } from 'react';
import { ROLES } from '@team-hub/shared';
import Button from '../ui/Button';

export default function InviteForm({ onInvite }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(ROLES.MEMBER);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successUrl, setSuccessUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessUrl('');
    setCopied(false);
    setSubmitting(true);
    try {
      const { inviteUrl } = await onInvite({ email: email.trim(), role });
      setSuccessUrl(inviteUrl);
      setEmail('');
    } catch (err) {
      setError(err.message || 'Failed to invite');
    } finally {
      setSubmitting(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(successUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="teammate@example.com"
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 dark:text-white"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 dark:text-white"
        >
          <option value={ROLES.MEMBER}>Member</option>
          <option value={ROLES.ADMIN}>Admin</option>
        </select>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send invite'}
        </Button>
      </div>
      {successUrl && (
        <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded flex flex-col sm:flex-row sm:items-center gap-2">
          <code className="text-xs flex-1 break-all text-gray-800 dark:text-gray-200">
            {successUrl}
          </code>
          <Button variant="secondary" size="sm" onClick={copy} type="button">
            {copied ? 'Copied!' : 'Copy link'}
          </Button>
        </div>
      )}
    </form>
  );
}
