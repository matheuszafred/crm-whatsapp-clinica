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

interface OriginPoint {
  origin: string;
  label: string;
  leads: number;
}

// Cor fixa por origem — a mesma origem tem que ter a mesma cor em qualquer período.
const ORIGIN_COLORS: Record<string, string> = {
  site: "#457ee7",
  instagram: "#ec4899",
  google_gbp: "#f59e0b",
  taggo: "#8b5cf6",
  direto: "#25d366",
  outro: "#94a3b8",
};

export function LeadOriginChart({ data }: { data: OriginPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-sm" style={{ color: "#aaa" }}>
        Sem leads no período
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(140, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 16, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
        <YAxis dataKey="label" type="category" tick={{ fontSize: 11 }} width={100} />
        <Tooltip
          cursor={{ fill: "#f8fafc" }}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(v) => [`${v} lead${v === 1 ? "" : "s"}`, "Leads"]}
        />
        <Bar dataKey="leads" radius={[0, 4, 4, 0]}>
          {data.map((d) => (
            <Cell key={d.origin} fill={ORIGIN_COLORS[d.origin] ?? "#94a3b8"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
