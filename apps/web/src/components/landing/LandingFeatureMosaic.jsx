'use client';

// Asymmetric three-feature layout — large goals card on the left,
// announcements + action items stacked on the right. Avoids the
// 3-up identical-card-grid SaaS cliché.
export default function LandingFeatureMosaic() {
  return (
    <div className="grid lg:grid-cols-12 gap-5">
      <FeatureGoals className="lg:col-span-7 lg:row-span-2" />
      <FeatureAnnouncements className="lg:col-span-5" />
      <FeatureActionItems className="lg:col-span-5" />
    </div>
  );
}

function Eyebrow({ children }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.18em] text-primary-600 dark:text-primary-300 font-semibold">
      {children}
    </p>
  );
}

function FeatureGoals({ className = '' }) {
  return (
    <article
      className={`relative overflow-hidden rounded-3xl border border-line bg-[color:var(--surface)] p-7 sm:p-9 ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0 opacity-50 dark:opacity-30"
        style={{
          background:
            'radial-gradient(40% 60% at 90% 0%, rgba(93,80,250,0.16), transparent 60%)',
        }}
      />
      <div className="relative">
        <Eyebrow>Goals</Eyebrow>
        <h3 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-balance">
          What we&apos;re working toward, written down once.
        </h3>
        <p className="mt-3 text-muted text-pretty leading-relaxed max-w-md">
          Goals carry milestones, owners, and a status that the whole team can
          see. They are the spine of the workspace.
        </p>

        <div className="mt-8 grid sm:grid-cols-2 gap-3">
          <GoalSnippet
            title="Migrate analytics to v3"
            owner="Devi"
            status="In progress"
            tone="primary"
            progress={55}
            milestones="3 / 7"
          />
          <GoalSnippet
            title="Hire a third designer"
            owner="Aria"
            status="Not started"
            tone="muted"
            progress={0}
            milestones="0 / 4"
          />
          <GoalSnippet
            title="Cut p95 below 250ms"
            owner="Theo"
            status="In progress"
            tone="primary"
            progress={82}
            milestones="5 / 6"
          />
          <GoalSnippet
            title="Q2 partner playbook"
            owner="Sumi"
            status="Completed"
            tone="success"
            progress={100}
            milestones="4 / 4"
          />
        </div>
      </div>
    </article>
  );
}

function GoalSnippet({ title, owner, status, tone, progress, milestones }) {
  const statusStyle = {
    primary:
      'bg-primary-600/10 text-primary-700 dark:text-primary-300',
    muted:
      'bg-[color:var(--surface-3)] text-muted',
    success:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  }[tone];
  const barStyle = {
    primary: 'bg-primary-500',
    muted: 'bg-ink-300 dark:bg-ink-700',
    success: 'bg-emerald-500',
  }[tone];
  return (
    <div className="rounded-xl border border-line bg-[color:var(--surface-2)] p-4">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold tracking-tight">{title}</h4>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusStyle}`}
        >
          {status}
        </span>
      </div>
      <div className="mt-3 h-1 rounded-full bg-[color:var(--surface-3)] overflow-hidden">
        <div className={`h-full ${barStyle}`} style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-subtle">
        <span>{owner}</span>
        <span className="font-mono">{milestones}</span>
      </div>
    </div>
  );
}

function FeatureAnnouncements({ className = '' }) {
  return (
    <article
      className={`rounded-3xl border border-line bg-[color:var(--surface)] p-7 sm:p-8 flex flex-col ${className}`}
    >
      <Eyebrow>Announcements</Eyebrow>
      <h3 className="mt-3 font-display text-xl sm:text-2xl font-extrabold tracking-tight text-balance">
        Context, broadcast once. Read by the whole team.
      </h3>
      <p className="mt-3 text-muted text-pretty leading-relaxed">
        Rich text, mentions, and reactions. Discussion stays attached.
      </p>

      <div className="mt-6 space-y-3">
        <Announcement
          name="Theo R."
          when="14m"
          body="Pushed the new pricing copy to staging. Looking for a sanity check before Thursday."
          reactions={[
            { e: '🚀', n: 8, on: true },
            { e: '🙏', n: 2 },
          ]}
        />
        <Announcement
          name="Aria W."
          when="2h"
          body="Welcoming Karan to the team — joining the platform pod next Monday."
          reactions={[
            { e: '🎉', n: 12, on: true },
            { e: '💜', n: 5 },
          ]}
        />
      </div>
    </article>
  );
}

function Announcement({ name, when, body, reactions = [] }) {
  return (
    <div className="rounded-xl bg-[color:var(--surface-2)] border border-line p-4">
      <div className="flex items-center gap-2 text-[11px] text-subtle">
        <div className="w-5 h-5 rounded-full bg-primary-500/15 grid place-items-center text-primary-700 dark:text-primary-300 font-semibold text-[10px]">
          {name[0]}
        </div>
        <span className="font-medium text-fg">{name}</span>
        <span className="text-subtle">· {when}</span>
      </div>
      <p className="mt-2 text-sm leading-snug">{body}</p>
      <div className="mt-3 flex gap-1.5">
        {reactions.map((r, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border ${
              r.on
                ? 'bg-primary-600/10 border-primary-600/30 text-primary-700 dark:text-primary-300'
                : 'border-line bg-[color:var(--surface)] text-muted'
            }`}
          >
            {r.e} <span className="font-medium">{r.n}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function FeatureActionItems({ className = '' }) {
  const items = [
    { t: 'Wire up Slack invite link', tag: 'Eng', tone: 'high', a: '#5d50fa' },
    { t: 'Draft Q2 OKR memo', tag: 'Ops', tone: 'med', a: '#ff9b1f' },
    { t: 'Onboarding A/B teardown', tag: 'Growth', tone: 'low', a: '#28c840' },
  ];
  return (
    <article
      className={`relative overflow-hidden rounded-3xl border border-line bg-[color:var(--surface)] p-7 sm:p-8 ${className}`}
    >
      <Eyebrow>Action items</Eyebrow>
      <h3 className="mt-3 font-display text-xl sm:text-2xl font-extrabold tracking-tight text-balance">
        The work itself.{' '}
        <span className="serif-italic font-normal text-muted">
          Moving, not piling up.
        </span>
      </h3>
      <p className="mt-3 text-muted text-pretty leading-relaxed">
        List or kanban. Assign, prioritize, due-date. Drag to done.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-2">
        {[
          { label: 'Today', count: 3, accent: true },
          { label: 'In progress', count: 6 },
          { label: 'Done', count: 14 },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-line bg-[color:var(--surface-2)] p-3"
          >
            <div className="flex items-center justify-between text-[10px] text-subtle uppercase tracking-wider">
              <span>{c.label}</span>
              {c.accent && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent-400" />
              )}
            </div>
            <div className="mt-1 text-lg font-bold tracking-tight">
              {c.count}
            </div>
          </div>
        ))}
      </div>

      <ul className="mt-4 space-y-1.5">
        {items.map((it) => (
          <li
            key={it.t}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[color:var(--surface-2)] border border-line text-[13px]"
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: it.a }}
              aria-hidden
            />
            <span className="flex-1 font-medium">{it.t}</span>
            <span className="text-[10px] uppercase tracking-wider text-subtle">
              {it.tag}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}
