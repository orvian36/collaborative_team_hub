'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import useAuthStore from '@/stores/authStore';
import ThemeToggle from '@/components/ui/ThemeToggle';
import LandingHeroPreview from '@/components/landing/LandingHeroPreview';
import LandingFeatureMosaic from '@/components/landing/LandingFeatureMosaic';
import LogoMark from '@/components/brand/LogoMark';

export default function Home() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-app text-fg overflow-x-hidden">
      <header
        className={`sticky top-0 z-40 transition-colors duration-300 ${
          scrolled
            ? 'backdrop-blur-md bg-[color:var(--bg)]/85 border-b border-line'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <LogoMark className="w-7 h-7" />
            <span className="font-semibold tracking-tight text-[15px]">
              Team Hub
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted">
            <a href="#primitives" className="hover:text-fg transition-colors">
              Primitives
            </a>
            <a href="#workflow" className="hover:text-fg transition-colors">
              How it works
            </a>
            <a href="#values" className="hover:text-fg transition-colors">
              Why it&apos;s built this way
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="ml-1 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[color:var(--fg)] text-[color:var(--bg)] text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Open workspace
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex px-3 py-2 text-sm text-muted hover:text-fg transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="ml-1 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[color:var(--fg)] text-[color:var(--bg)] text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Start free
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <Hero />
      <TrustStrip />
      <Primitives />
      <Workflow />
      <Values />
      <ClosingCTA />
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative">
      <BackgroundGrid />
      <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 lg:pt-28 lg:pb-32 grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        <div className="lg:col-span-6 animate-slide-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-[color:var(--surface)] pl-1 pr-3.5 py-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-600/10 text-primary-700 dark:text-primary-300 px-2 py-0.5 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse-soft" />
              Realtime
            </span>
            Built for teams of 3 to 30
          </div>

          <h1 className="mt-6 font-display text-display-2xl font-extrabold tracking-tightest text-fg text-balance">
            Keep the work
            <br />
            moving,{' '}
            <span className="serif-italic text-primary-600 dark:text-primary-300">
              together
            </span>
            .
          </h1>

          <p className="mt-6 max-w-lg text-lg text-muted text-pretty leading-relaxed">
            One shared space for goals, announcements, and action items. Light
            enough to live in. Strong enough to run on.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-full bg-[color:var(--fg)] text-[color:var(--bg)] pl-5 pr-2 py-2 text-sm font-medium shadow-lift hover:shadow-glow-primary transition-all"
            >
              Create your workspace
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-500 text-white group-hover:translate-x-0.5 transition-transform">
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium hover:bg-[color:var(--surface-2)] transition-colors"
            >
              Sign in
            </Link>
          </div>

          <ul className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-[13px] text-muted">
            {[
              'Free for small teams',
              'No credit card',
              'Realtime by default',
              'Dark mode, properly',
              'Roles & invitations',
              'Audit trail built in',
            ].map((s) => (
              <li key={s} className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-primary-600 dark:text-primary-300 shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-6 relative animate-slide-up-soft">
          <LandingHeroPreview />
        </div>
      </div>
    </section>
  );
}

function BackgroundGrid() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-grid-light dark:bg-grid-dark mask-fade-b"
        style={{ backgroundSize: '64px 64px' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 w-[520px] h-[520px] -z-10 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(93,80,250,0.18), transparent 60%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-40 -right-32 w-[420px] h-[420px] -z-10 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(255,184,74,0.14), transparent 60%)',
        }}
      />
    </>
  );
}

function TrustStrip() {
  const teams = [
    'Northwind',
    'Cloudkit',
    'Lumen Labs',
    'Postcard',
    'Foundry & Co',
    'Halftone',
    'Riverbend',
    'Quietframe',
  ];
  return (
    <section className="border-y border-line bg-[color:var(--surface-2)]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-center gap-6">
        <p className="text-xs uppercase tracking-[0.18em] text-subtle shrink-0">
          Used by teams shipping at
        </p>
        <div className="overflow-hidden mask-fade-x flex-1">
          <div className="flex gap-12 animate-marquee w-max">
            {[...teams, ...teams].map((t, i) => (
              <span
                key={i}
                className="text-[15px] font-semibold tracking-tight text-muted whitespace-nowrap opacity-80"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Primitives() {
  return (
    <section id="primitives" className="relative py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.18em] text-primary-600 dark:text-primary-300 font-semibold">
            Three primitives. One rhythm.
          </p>
          <h2 className="mt-4 font-display text-display-xl font-extrabold tracking-tight text-balance">
            Everything a team needs.
            <br />
            <span className="serif-italic text-muted font-normal">
              Nothing a team doesn&apos;t.
            </span>
          </h2>
          <p className="mt-5 text-muted text-lg max-w-xl text-pretty">
            We didn&apos;t want another tool that bolts on features until it
            collapses. Three primitives, deliberately small, that compose into
            most of how a real team operates.
          </p>
        </div>

        <div className="mt-14">
          <LandingFeatureMosaic />
        </div>
      </div>
    </section>
  );
}

function Workflow() {
  const steps = [
    {
      n: '01',
      title: 'Set the goal',
      body: 'Define what shipping looks like. Add milestones if it helps. Skip them if it doesn’t.',
    },
    {
      n: '02',
      title: 'Announce the why',
      body: 'Post context once. Team reads, reacts, comments. No more thread archaeology.',
    },
    {
      n: '03',
      title: 'Move the work',
      body: 'Action items flow from list to kanban to done. Assignees see what’s on them, today.',
    },
    {
      n: '04',
      title: 'See the rhythm',
      body: 'Dashboard surfaces what’s overdue, what’s done, what’s next. Audit log keeps it honest.',
    },
  ];
  return (
    <section
      id="workflow"
      className="border-t border-line bg-[color:var(--surface-2)] py-24 sm:py-32"
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14">
          <div className="lg:col-span-4">
            <p className="text-xs uppercase tracking-[0.18em] text-primary-600 dark:text-primary-300 font-semibold">
              How it works
            </p>
            <h2 className="mt-4 font-display text-display-lg font-extrabold tracking-tight text-balance">
              Four moves a week.
              <br />
              That&apos;s the loop.
            </h2>
            <p className="mt-4 text-muted text-pretty leading-relaxed">
              Most teams don&apos;t need a methodology. They need a rhythm they
              can keep. Team Hub is shaped around one.
            </p>
          </div>
          <ol className="lg:col-span-8 grid sm:grid-cols-2 gap-px bg-line border border-line rounded-2xl overflow-hidden">
            {steps.map((s) => (
              <li
                key={s.n}
                className="relative bg-[color:var(--surface)] p-7 hover:bg-[color:var(--surface-3)] transition-colors"
              >
                <span className="font-mono text-[11px] tracking-widest text-primary-600 dark:text-primary-300">
                  {s.n}
                </span>
                <h3 className="mt-2 font-semibold text-lg tracking-tight">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  {s.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function Values() {
  const items = [
    {
      h: 'Realtime, but quiet',
      b: 'Updates land instantly. Notifications respect your attention. No badges screaming for clicks.',
    },
    {
      h: 'Roles that mean something',
      b: 'Admin, Member, Viewer. Capabilities checked at the edge and on the server. No accidental admin.',
    },
    {
      h: 'Designed for both eyes',
      b: 'Light mode for daylight, dark mode that’s actually been thought about. Same hierarchy in either.',
    },
    {
      h: 'Audit log, not afterthought',
      b: 'Every change is recorded. Filter, export, learn. Trust that scales without paranoia.',
    },
  ];
  return (
    <section id="values" className="py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="max-w-2xl mb-14">
          <p className="text-xs uppercase tracking-[0.18em] text-primary-600 dark:text-primary-300 font-semibold">
            Why it&apos;s built this way
          </p>
          <h2 className="mt-4 font-display text-display-lg font-extrabold tracking-tight text-balance">
            Boring guarantees,
            <br />
            <span className="serif-italic font-normal text-muted">
              quietly kept.
            </span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
          {items.map((it, i) => (
            <div key={it.h} className="flex gap-5">
              <span className="font-mono text-xs text-subtle pt-1">
                0{i + 1}
              </span>
              <div className="border-t border-line pt-4 flex-1">
                <h3 className="font-semibold tracking-tight">{it.h}</h3>
                <p className="mt-2 text-muted text-[15px] leading-relaxed text-pretty">
                  {it.b}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section className="px-5 sm:px-8 pb-24">
      <div className="max-w-6xl mx-auto relative overflow-hidden rounded-3xl border border-line bg-[color:var(--surface)] px-6 sm:px-12 py-16 sm:py-20">
        <div
          aria-hidden
          className="absolute inset-0 opacity-50 dark:opacity-40"
          style={{
            background:
              'radial-gradient(60% 100% at 0% 100%, rgba(93,80,250,0.18), transparent 60%), radial-gradient(50% 100% at 100% 0%, rgba(255,184,74,0.16), transparent 60%)',
          }}
        />
        <div className="relative max-w-2xl">
          <h2 className="font-display text-display-lg font-extrabold tracking-tight text-balance">
            Bring the team in.
            <br />
            <span className="serif-italic font-normal text-primary-600 dark:text-primary-300">
              Today, not Q4.
            </span>
          </h2>
          <p className="mt-5 text-muted text-lg text-pretty">
            Set up your first workspace in about two minutes. Invite the rest
            with a link. We&apos;ll be here when you need us, invisible when
            you don&apos;t.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-full bg-[color:var(--fg)] text-[color:var(--bg)] pl-5 pr-2 py-2 text-sm font-medium shadow-lift hover:shadow-glow-primary transition-all"
            >
              Create your workspace
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-500 text-white group-hover:translate-x-0.5 transition-transform">
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium hover:bg-[color:var(--surface-2)] transition-colors"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-muted">
        <div className="flex items-center gap-2.5">
          <LogoMark className="w-5 h-5" />
          <span className="font-semibold tracking-tight text-fg">
            Team Hub
          </span>
          <span className="hidden sm:inline text-subtle">·</span>
          <span className="text-subtle">
            Made for teams that ship.
          </span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#primitives" className="hover:text-fg transition-colors">
            Primitives
          </a>
          <a href="#workflow" className="hover:text-fg transition-colors">
            Workflow
          </a>
          <Link href="/login" className="hover:text-fg transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </footer>
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
