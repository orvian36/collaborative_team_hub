'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import useAuthStore from '@/stores/authStore';
import Button from '@/components/ui/Button';

export default function InviteLanding() {
  const router = useRouter();
  const { token } = useParams();
  const { user, isAuthenticated, isCheckingAuth, checkAuth, logout } =
    useAuthStore();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState('');

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await api.get(`/api/invitations/${token}`);
        if (!cancelled) setData(d);
      } catch (err) {
        if (!cancelled) setLoadError(err.message || 'Invitation not found');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const accept = async () => {
    setAccepting(true);
    setAcceptError('');
    try {
      const r = await api.post(`/api/invitations/${token}/accept`, {});
      router.push(`/dashboard/${r.workspace.id}`);
    } catch (err) {
      if (err.status === 409) {
        try {
          const meta = await api.get(`/api/invitations/${token}`);
          if (meta.workspace?.id) {
            router.push(`/dashboard/${meta.workspace.id}`);
            return;
          }
        } catch {}
      }
      setAcceptError(err.message || 'Failed to accept invitation');
      setAccepting(false);
    }
  };

  if (loadError) {
    return (
      <Shell>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Invitation unavailable
        </h1>
        <p className="text-gray-600 dark:text-gray-300">{loadError}</p>
      </Shell>
    );
  }

  if (!data || isCheckingAuth) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Shell>
    );
  }

  const { workspace, invitation } = data;
  const status = invitation.status;

  if (status === 'EXPIRED' || status === 'REVOKED') {
    return (
      <Shell workspace={workspace}>
        <p className="text-gray-700 dark:text-gray-300">
          This invitation is {status.toLowerCase()}. Ask an admin to send you a
          new one.
        </p>
      </Shell>
    );
  }

  if (status === 'ACCEPTED') {
    return (
      <Shell workspace={workspace}>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          This invitation has already been accepted.
        </p>
        {isAuthenticated && (
          <Link
            href={`/dashboard/${workspace.id}`}
            className="text-primary-600 hover:underline"
          >
            Go to {workspace.name}
          </Link>
        )}
      </Shell>
    );
  }

  if (!isAuthenticated) {
    const next = `/invite/${token}`;
    return (
      <Shell workspace={workspace}>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          You&apos;ve been invited to <strong>{workspace.name}</strong> as{' '}
          <strong>{invitation.role}</strong>. Sign in or create an account using{' '}
          <strong>{invitation.email}</strong> to accept.
        </p>
        <div className="flex gap-2">
          <Link href={`/login?next=${encodeURIComponent(next)}`}>
            <Button>Sign in</Button>
          </Link>
          <Link href={`/register?next=${encodeURIComponent(next)}`}>
            <Button variant="secondary">Create account</Button>
          </Link>
        </div>
      </Shell>
    );
  }

  const emailMatches =
    user?.email?.toLowerCase() === invitation.email.toLowerCase();
  if (!emailMatches) {
    return (
      <Shell workspace={workspace}>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          This invitation was sent to <strong>{invitation.email}</strong> but
          you&apos;re signed in as <strong>{user.email}</strong>.
        </p>
        <Button variant="secondary" onClick={() => logout()}>
          Log out and try again
        </Button>
      </Shell>
    );
  }

  return (
    <Shell workspace={workspace}>
      <p className="text-gray-700 dark:text-gray-300 mb-6">
        Accept invitation to <strong>{workspace.name}</strong> as{' '}
        <strong>{invitation.role}</strong>?
      </p>
      {acceptError && (
        <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded mb-4">
          <p className="text-sm text-red-700 dark:text-red-400">
            {acceptError}
          </p>
        </div>
      )}
      <Button onClick={accept} disabled={accepting}>
        {accepting ? 'Accepting…' : 'Accept invitation'}
      </Button>
    </Shell>
  );
}

function Shell({ workspace, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-8 max-w-md w-full">
        {workspace && (
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-bold overflow-hidden"
              style={{ backgroundColor: workspace.accentColor }}
            >
              {workspace.iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={workspace.iconUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                (workspace.name[0] || '?').toUpperCase()
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {workspace.name}
            </h2>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
