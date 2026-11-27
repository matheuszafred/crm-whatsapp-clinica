"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface DevicesChartProps {
  data: { device: string; views: number }[];
}

const COLORS: Record<string, string> = {
  mobile: "#25d366",
  desktop: "#457ee7",
  tablet: "#f59e0b",
};

const LABELS: Record<string, string> = {
  mobile: "Mobile",
  desktop: "Desktop",
  tablet: "Tablet",
};

export function DevicesChart({ data }: DevicesChartProps) {
  const formatted = data.map((d) => ({
    name: LABELS[d.device] || d.device,
    value: d.views,
    color: COLORS[d.device] || "#94a3b8",
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={formatted}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
        >
          {formatted.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(value) => [Number(value).toLocaleString("pt-BR"), "Visualizações"]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
