'use client';

import Link from 'next/link';
import LogoMark from '@/components/brand/LogoMark';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function AuthShell({
  children,
  title,
  subtitle,
  side,
  footer,
}) {
  return (
    <div className="min-h-screen bg-app text-fg flex flex-col lg:flex-row">
      <aside className="relative hidden lg:flex lg:w-[44%] xl:w-[42%] flex-col justify-between p-12 overflow-hidden border-r border-line bg-[color:var(--surface-2)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 60% at 0% 100%, rgba(93,80,250,0.18), transparent 60%), radial-gradient(50% 60% at 100% 0%, rgba(255,184,74,0.12), transparent 60%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-grid-light dark:bg-grid-dark opacity-40 mask-fade-b"
          style={{ backgroundSize: '64px 64px' }}
        />
        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <LogoMark className="w-7 h-7" />
            <span className="font-semibold tracking-tight">Team Hub</span>
          </Link>
        </div>

        <div className="relative max-w-md">
          {side ?? <DefaultSidePanel />}
        </div>

        <div className="relative text-xs text-subtle">
          © {new Date().getFullYear()} Team Hub. Made for teams that ship.
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <div className="lg:hidden flex items-center justify-between px-5 sm:px-8 h-16 border-b border-line">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <LogoMark className="w-6 h-6" />
            <span className="font-semibold tracking-tight text-sm">
              Team Hub
            </span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-12 lg:py-0">
          <div className="w-full max-w-sm">
            <div className="hidden lg:flex justify-end mb-10">
              <ThemeToggle />
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-balance">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-3 text-muted text-pretty">{subtitle}</p>
            )}

            <div className="mt-8">{children}</div>

            {footer && (
              <p className="mt-8 text-sm text-muted">{footer}</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function DefaultSidePanel() {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-primary-600 dark:text-primary-300 font-semibold">
        From the workspace
      </p>
      <blockquote className="mt-5 font-display text-2xl xl:text-[28px] leading-[1.2] tracking-tight font-semibold text-balance">
        We replaced four standups, two spreadsheets, and a Notion mess with one
        place to{' '}
        <span className="serif-italic font-normal text-primary-600 dark:text-primary-300">
          actually run
        </span>{' '}
        the team.
      </blockquote>
      <div className="mt-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-accent-300 text-accent-900 grid place-items-center text-sm font-semibold">
          AW
        </div>
        <div>
          <p className="text-sm font-medium">Aria Walsh</p>
          <p className="text-xs text-subtle">Head of Operations, Northwind</p>
        </div>
      </div>

      <dl className="mt-12 grid grid-cols-3 gap-6 max-w-sm border-t border-line pt-6">
        <Stat n="3 min" l="To onboard" />
        <Stat n="0" l="Plugins needed" />
        <Stat n="∞" l="Workspaces" />
      </dl>
    </div>
  );
}

function Stat({ n, l }) {
  return (
    <div>
      <dt className="font-display text-2xl font-bold tracking-tight">{n}</dt>
      <dd className="text-[11px] uppercase tracking-wider text-subtle mt-0.5">
        {l}
      </dd>
    </div>
  );
}
