// Phase 2: Outside MVP Phase 1 scope. Keep for Phase 2 implementation.
// See /issues/PHASE2_SCOPE.md
'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface HoursBarChartProps {
  data: { month: string; hours: number }[];
}

export function HoursBarChart({ data }: HoursBarChartProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';

  if (!data?.length)
    return <p className="text-center text-brand-muted text-sm py-8">No data available</p>;

  return (
    <div>
      <ResponsiveContainer width="100%" height={240} aria-label="Hours served by month bar chart">
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#d1fae5'} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#6b7280' }} />
          <YAxis tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#6b7280' }} />
          <Tooltip />
          <Bar dataKey="hours" fill={isDark ? '#34d399' : '#059669'} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <table className="sr-only">
        <caption>Hours served by month</caption>
        <thead>
          <tr>
            <th>Month</th>
            <th>Hours</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}>
              <td>{d.month}</td>
              <td>{d.hours}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
