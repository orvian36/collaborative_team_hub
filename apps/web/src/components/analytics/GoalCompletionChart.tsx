'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export default function GoalCompletionChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-[color:var(--surface)] p-8 text-center">
        <p className="text-sm text-muted">
          No goal activity yet. Create a goal to start tracking momentum.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-line bg-[color:var(--surface)] p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-subtle font-semibold">
            Six-month rhythm
          </p>
          <h3 className="text-lg font-semibold text-fg tracking-tight mt-0.5">
            Goals created vs. completed
          </h3>
        </div>
        <div className="flex gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary-500" /> Created
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed
          </span>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: -20 }}>
            <CartesianGrid
              strokeDasharray="2 4"
              stroke="currentColor"
              strokeOpacity={0.12}
              vertical={false}
            />
            <XAxis
              dataKey="month"
              stroke="currentColor"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              stroke="currentColor"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: 'currentColor', fillOpacity: 0.06 }}
              contentStyle={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                fontSize: 12,
                color: 'var(--fg)',
                boxShadow:
                  '0 12px 32px -12px rgba(13,14,28,0.18), 0 2px 4px rgba(13,14,28,0.04)',
              }}
              labelStyle={{ color: 'var(--fg-muted)', fontWeight: 600 }}
            />
            <Bar
              dataKey="created"
              fill="#5d50fa"
              radius={[6, 6, 0, 0]}
              name="Created"
            />
            <Bar
              dataKey="completed"
              fill="#10b981"
              radius={[6, 6, 0, 0]}
              name="Completed"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
