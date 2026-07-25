// Phase 2: Outside MVP Phase 1 scope. Keep for Phase 2 implementation.
// See /issues/PHASE2_SCOPE.md
'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface HoursBarChartProps {
  data: { month: string; hours: number }[];
}

export function HoursBarChart({ data }: HoursBarChartProps) {
  if (!data?.length)
    return <p className="text-center text-brand-muted text-sm py-8">No data available</p>;

  return (
    <div>
      <ResponsiveContainer width="100%" height={240} aria-label="Hours served by month bar chart">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-8)" strokeOpacity={0.3} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-chart-8)' }} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--color-chart-8)' }} />
          <Tooltip />
          <Bar dataKey="hours" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
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
