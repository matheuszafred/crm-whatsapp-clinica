"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface TrafficChartProps {
  data: { date: string; pageviews: number; whatsapp: number; leads: number }[];
}

export function TrafficChart({ data }: TrafficChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    date: d.date.slice(5),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={formatted} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          labelFormatter={(l) => `Data: ${l}`}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="pageviews" stroke="#457ee7" strokeWidth={2} dot={false} name="Pageviews" />
        <Line type="monotone" dataKey="whatsapp" stroke="#25d366" strokeWidth={2} dot={false} name="WhatsApp" />
        <Line type="monotone" dataKey="leads" stroke="#f59e0b" strokeWidth={2} dot={false} name="Leads" />
      </LineChart>
    </ResponsiveContainer>
  );
}
