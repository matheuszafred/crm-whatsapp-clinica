"use client";

import { cn } from "@/lib/utils";

const PERIODOS = [
  { label: "7d", value: 7, titulo: "7 dias" },
  { label: "30d", value: 30, titulo: "30 dias" },
  { label: "90d", value: 90, titulo: "90 dias" },
];

/**
 * Seletor de período no cabeçalho.
 *
 * Rótulo abreviado ("7d") porque mora na barra de título, onde espaço é caro —
 * o texto por extenso vai no `title`, para quem passar o mouse. As três telas de
 * métrica usam o mesmo componente; antes cada uma tinha sua própria fileira de
 * pílulas, com cor diferente por página.
 */
export function PeriodTabs({
  valor,
  onChange,
}: {
  valor: number;
  onChange: (dias: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-md bg-muted p-0.5">
      {PERIODOS.map((p) => (
        <button
          key={p.value}
          type="button"
          title={p.titulo}
          onClick={() => onChange(p.value)}
          aria-pressed={valor === p.value}
          className={cn(
            "rounded px-2.5 py-1 text-xs font-medium tabular-nums transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            valor === p.value
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
