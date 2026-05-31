'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const LIGHT_COLORS = [
  '#059669',
  '#0891b2',
  '#7c3aed',
  '#d97706',
  '#dc2626',
  '#0d9488',
  '#6366f1',
  '#64748b',
];

const DARK_COLORS = [
  '#34d399',
  '#22d3ee',
  '#a78bfa',
  '#fbbf24',
  '#f87171',
  '#2dd4bf',
  '#818cf8',
  '#94a3b8',
];

interface CategoryPieChartProps {
  data: { category: string; count: number }[];
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const colors = mounted && resolvedTheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  if (!data.length)
    return <p className="text-center text-brand-muted text-sm py-8">No data available</p>;

  const chartData = data.map((d) => ({
    name: d.category.charAt(0) + d.category.slice(1).toLowerCase(),
    value: d.count,
  }));

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
              <Cell key={chartData[i].name} fill={colors[i % colors.length]} />
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
