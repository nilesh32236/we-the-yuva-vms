// Phase 2: Outside MVP Phase 1 scope. Keep for Phase 2 implementation.
// See /issues/PHASE2_SCOPE.md
'use client';

import { useMemo } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const CHART_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
  'var(--color-chart-6)',
  'var(--color-chart-7)',
  'var(--color-chart-8)',
];

interface CategoryPieChartProps {
  data: { category: string; count: number }[];
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  const chartData = useMemo(
    () =>
      (data ?? []).map((d) => ({
        name: d.category.charAt(0) + d.category.slice(1).toLowerCase(),
        value: d.count,
      })),
    [data],
  );

  if (!data?.length)
    return <p className="text-center text-brand-muted text-sm py-8">No data available</p>;

  return (
    <div>
      <ResponsiveContainer
        width="100%"
        height={260}
        aria-label="Opportunities by category pie chart"
      >
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={90}
            dataKey="value"
            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {chartData.map((_, i) => (
              <Cell key={chartData[i].name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      {/* Screen reader fallback */}
      <table className="sr-only">
        <caption>Opportunities by category</caption>
        <thead>
          <tr>
            <th>Category</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          {chartData.map((d) => (
            <tr key={d.name}>
              <td>{d.name}</td>
              <td>{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
