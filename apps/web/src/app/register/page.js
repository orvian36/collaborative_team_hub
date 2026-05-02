'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/stores/authStore';
import AuthShell from '@/components/auth/AuthShell';
import TextField from '@/components/auth/TextField';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name || !email || !password) {
      setFormError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long');
      return;
    }

    const res = await register(name, email, password);
    if (res.success) {
      const next = new URLSearchParams(window.location.search).get('next');
      router.push(next && next.startsWith('/') ? next : '/dashboard');
    }
  };

  const message = error || formError;

  return (
    <AuthShell
      title="Start your workspace."
      subtitle="Two minutes to set up. Invite the team after."
      footer={
        <>
          Already on Team Hub?{' '}
          <Link
            href="/login"
            className="font-medium text-primary-600 dark:text-primary-300 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {message && (
          <div
            role="alert"
            className="rounded-xl border border-rose-500/30 bg-rose-500/8 px-4 py-3 text-sm text-rose-700 dark:text-rose-300"
          >
            {message}
          </div>
        )}

        <TextField
          id="name"
          label="Your name"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Devi Kapoor"
        />

        <TextField
          id="email"
          label="Work email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@team.com"
        />

        <TextField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          hint="Min 6 characters"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[color:var(--fg)] text-[color:var(--bg)] py-3 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Spinner /> Creating workspace
            </>
          ) : (
            <>
              Create workspace
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <ul className="mt-6 space-y-1.5 text-[13px] text-muted">
          {[
            'Free for small teams',
            'Roles and invitations from day one',
            'Realtime, with a real audit log',
          ].map((s) => (
            <li key={s} className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-primary-600 dark:text-primary-300 shrink-0" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </form>
    </AuthShell>
  );
}

function ArrowRight({ className = '' }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M3 8h10" />
      <path d="m9 4 4 4-4 4" />
    </svg>
  );
}

function Check({ className = '' }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="m3 8 3.5 3.5L13 5" />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"
      aria-hidden
    />
  );
}
