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
  if (!data || data.length === 0) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Goal completion (last 6 months)
      </h3>
      <div className="h-64">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#3f3f46"
              strokeOpacity={0.2}
            />
            <XAxis dataKey="month" stroke="currentColor" />
            <YAxis allowDecimals={false} stroke="currentColor" />
            <Tooltip />
            <Legend />
            <Bar dataKey="created" fill="#6366f1" name="Created" />
            <Bar dataKey="completed" fill="#10b981" name="Completed" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
