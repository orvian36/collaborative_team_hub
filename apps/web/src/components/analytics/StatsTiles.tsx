'use client';

// Avoids the "hero metric template" — instead of three identical big-number
// tiles, this is a single composite "rhythm row" with one anchor stat,
// supporting facts, and a goal-status sparkline strip.
export default function StatsTiles({ stats }) {
  if (!stats) return null;

  const completed = stats.goalsByStatus?.COMPLETED ?? 0;
  const inProgress = stats.goalsByStatus?.IN_PROGRESS ?? 0;
  const notStarted = stats.goalsByStatus?.NOT_STARTED ?? 0;
  const total = stats.totalGoals || completed + inProgress + notStarted || 1;

  const completedPct = (completed / total) * 100;
  const inProgressPct = (inProgress / total) * 100;
  const notStartedPct = (notStarted / total) * 100;

  return (
    <section className="rounded-2xl border border-line bg-[color:var(--surface)] overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-line">
        <div className="lg:col-span-5 p-6">
          <p className="text-[11px] uppercase tracking-[0.18em] text-subtle font-semibold">
            This week
          </p>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-display text-5xl font-extrabold tracking-tight text-fg">
              {stats.completedActionItemsThisWeek}
            </span>
            <span className="text-sm text-muted">
              action items shipped
            </span>
          </div>

          <div className="mt-5 flex items-center gap-5 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-muted">
                <span className="font-semibold text-fg">
                  {stats.overdueActionItems}
                </span>{' '}
                overdue
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-500" />
              <span className="text-muted">
                <span className="font-semibold text-fg">
                  {inProgress}
                </span>{' '}
                goals in flight
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 p-6 bg-[color:var(--surface-2)]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-subtle font-semibold">
              Goal status across the workspace
            </p>
            <span className="text-xs text-subtle">
              {stats.totalGoals} total
            </span>
          </div>

          <div className="h-2 rounded-full bg-[color:var(--surface-3)] overflow-hidden flex">
            <span
              className="h-full bg-emerald-500"
              style={{ width: `${completedPct}%` }}
              title={`${completed} completed`}
            />
            <span
              className="h-full bg-primary-500"
              style={{ width: `${inProgressPct}%` }}
              title={`${inProgress} in progress`}
            />
            <span
              className="h-full bg-ink-300 dark:bg-ink-700"
              style={{ width: `${notStartedPct}%` }}
              title={`${notStarted} not started`}
            />
          </div>

          <dl className="mt-5 grid grid-cols-3 gap-4">
            <Legend
              dot="bg-emerald-500"
              label="Completed"
              value={completed}
              total={total}
            />
            <Legend
              dot="bg-primary-500"
              label="In progress"
              value={inProgress}
              total={total}
            />
            <Legend
              dot="bg-ink-300 dark:bg-ink-700"
              label="Not started"
              value={notStarted}
              total={total}
            />
          </dl>
        </div>
      </div>
    </section>
  );
}

function Legend({ dot, label, value, total }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <dt className="flex items-center gap-2 text-xs text-muted">
        <span className={`w-2 h-2 rounded-full ${dot}`} />
        {label}
      </dt>
      <dd className="mt-1 flex items-baseline gap-1.5">
        <span className="font-display text-xl font-bold tabular-nums">
          {value}
        </span>
        <span className="text-[11px] text-subtle font-mono">{pct}%</span>
      </dd>
    </div>
  );
}
