'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/stores/authStore';
import AuthShell from '@/components/auth/AuthShell';
import TextField from '@/components/auth/TextField';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email || !password) {
      setFormError('Please fill in all fields');
      return;
    }

    const res = await login(email, password);
    if (res.success) {
      const next = new URLSearchParams(window.location.search).get('next');
      router.push(next && next.startsWith('/') ? next : '/dashboard');
    }
  };

  const message = error || formError;

  return (
    <AuthShell
      title="Welcome back."
      subtitle="Sign in to pick up where the team left off."
      footer={
        <>
          New here?{' '}
          <Link
            href="/register"
            className="font-medium text-primary-600 dark:text-primary-300 hover:underline"
          >
            Create a workspace
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
          id="email"
          label="Email"
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
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[color:var(--fg)] text-[color:var(--bg)] py-3 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Spinner /> Signing in
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-[12px] text-subtle text-center pt-2">
          By continuing you agree to our terms and privacy policy.
        </p>
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

function Spinner() {
  return (
    <span
      className="inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"
      aria-hidden
    />
  );
}
