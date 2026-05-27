'use client';

// Editorial product preview for the hero. A tilted "browser pane" stack
// showing miniature versions of the three primitives: a goal, an
// announcement, and an action item card. Static, themed, accessible.
export default function LandingHeroPreview() {
  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-3xl opacity-50 blur-2xl"
        style={{
          background:
            'radial-gradient(60% 70% at 30% 20%, rgba(93,80,250,0.35), transparent 60%), radial-gradient(60% 60% at 80% 80%, rgba(255,184,74,0.25), transparent 60%)',
        }}
      />

      {/* Main pane */}
      <div className="relative rounded-2xl border border-line bg-[color:var(--surface)] shadow-lift overflow-hidden">
        <div className="flex items-center justify-between px-4 h-9 border-b border-line bg-[color:var(--surface-2)]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]/70" />
          </div>
          <div className="text-[11px] text-subtle font-mono">
            workspace / goals
          </div>
          <div className="w-12" />
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">
                Quarterly goal
              </p>
              <h4 className="font-semibold tracking-tight text-[15px] mt-0.5">
                Ship the new onboarding flow
              </h4>
            </div>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary-600/12 text-primary-700 dark:text-primary-300">
              In progress
            </span>
          </div>

          <ProgressBar value={62} />

          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Owners" value="3" />
            <Stat label="Items" value="12" />
            <Stat label="Due" value="May 22" />
          </div>

          <div className="pt-1 space-y-2">
            <Milestone label="Discovery + spec" done />
            <Milestone label="Backend wiring" done />
            <Milestone label="Empty-state polish" />
            <Milestone label="Launch in beta cohort" />
          </div>
        </div>
      </div>

      {/* Floating announcement card */}
      <div className="absolute -left-4 sm:-left-8 bottom-12 sm:bottom-16 w-[60%] sm:w-[260px] rounded-xl border border-line bg-[color:var(--surface)] shadow-lift p-4 rotate-[-3deg]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-accent-300 text-accent-900 flex items-center justify-center text-xs font-semibold">
            MJ
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold leading-tight">
              Maya Jiwon
            </p>
            <p className="text-[10px] text-subtle">Announcement · 2m ago</p>
          </div>
        </div>
        <p className="mt-3 text-[12px] text-fg leading-snug">
          Heads up: design review moves to{' '}
          <span className="font-semibold">Thursday 2pm</span>. Bring the new
          empty-state pass.
        </p>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-subtle">
          <Reaction emoji="👍" count="6" active />
          <Reaction emoji="✨" count="3" />
          <Reaction emoji="👀" count="2" />
        </div>
      </div>

      {/* Floating action item */}
      <div className="absolute -right-3 sm:-right-6 -top-4 sm:-top-6 w-[58%] sm:w-[240px] rounded-xl border border-line bg-[color:var(--surface)] shadow-lift p-4 rotate-[2.5deg]">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.18em] text-subtle">
            Action item
          </p>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-100 text-accent-800 dark:bg-accent-300/15 dark:text-accent-300 font-medium">
            High
          </span>
        </div>
        <p className="mt-1.5 font-semibold text-[13px] tracking-tight leading-snug">
          Move guest sign-up off the marketing homepage
        </p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex -space-x-1.5">
            {['#5d50fa', '#ff9b1f', '#28c840'].map((c, i) => (
              <span
                key={i}
                className="w-5 h-5 rounded-full border-2 border-[color:var(--surface)]"
                style={{ background: c }}
              />
            ))}
          </div>
          <span className="text-[11px] text-subtle font-medium">Due Fri</span>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-[color:var(--surface-2)] border border-line py-2">
      <div className="text-[15px] font-semibold tracking-tight">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-subtle mt-0.5">
        {label}
      </div>
    </div>
  );
}

function Milestone({ label, done }) {
  return (
    <div className="flex items-center gap-2.5 text-[12.5px]">
      <span
        className={`w-4 h-4 rounded-full grid place-items-center border ${
          done
            ? 'bg-primary-600 border-primary-600 text-white'
            : 'border-line-strong bg-[color:var(--surface)]'
        }`}
      >
        {done && (
          <svg
            viewBox="0 0 16 16"
            className="w-2.5 h-2.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m3 8 3.5 3.5L13 5" />
          </svg>
        )}
      </span>
      <span className={done ? 'text-muted line-through' : 'text-fg'}>
        {label}
      </span>
    </div>
  );
}

function ProgressBar({ value }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-[color:var(--surface-3)] overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-700"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function Reaction({ emoji, count, active }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 border ${
        active
          ? 'bg-primary-600/10 border-primary-600/30 text-primary-700 dark:text-primary-300'
          : 'border-line bg-[color:var(--surface-2)]'
      }`}
    >
      <span>{emoji}</span>
      <span className="font-medium">{count}</span>
    </span>
  );
}
