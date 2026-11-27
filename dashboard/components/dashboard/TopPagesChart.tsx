"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TopPagesChartProps {
  data: { page: string; views: number }[];
}

export function TopPagesChart({ data }: TopPagesChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    page: d.page === "/" ? "Home" : d.page.replace(/\/$/, "").split("/").pop() || d.page,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={formatted} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis dataKey="page" type="category" tick={{ fontSize: 11 }} width={80} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey="views" fill="#457ee7" radius={[0, 4, 4, 0]} name="Visualizações" />
      </BarChart>
    </ResponsiveContainer>
  );
}
