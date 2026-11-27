"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface TrafficSourceChartProps {
  data: { channel: string; sessions: number }[];
}

const COLORS = ["#457ee7", "#25d366", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899"];

export function TrafficSourceChart({ data }: TrafficSourceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-sm" style={{ color: "#aaa" }}>
        Sem dados de origem no período
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis dataKey="channel" type="category" tick={{ fontSize: 11 }} width={110} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(value) => [`${value} sessões`, "Sessões"]}
        />
        <Bar dataKey="sessions" radius={[0, 4, 4, 0]}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
