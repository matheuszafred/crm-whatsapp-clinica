"use client";

import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface KpiCardProps {
  title: string;
  value: string | number;
  suffix?: string;
  description?: string;
  icon?: LucideIcon;
}

/**
 * Número de destaque no topo das telas de métrica.
 *
 * Trocou emoji por ícone e perdeu a barrinha de progresso decorativa: aquela
 * barra mostrava sempre 1/3 preenchido, independente do valor — era enfeite com
 * cara de dado, o pior tipo de elemento num painel.
 *
 * Sem cor por card, também de propósito. Cada KPI tinha seu tom, o que fazia a
 * tela parecer um mosaico e gastava a atenção sem codificar nada: a cor não
 * significava bom nem ruim. Cor fica reservada para o que tem significado.
 */
export function KpiCard({ title, value, suffix, description, icon: Icon }: KpiCardProps) {
  return (
    <Card className="shadow-xs">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {title}
          </p>
          {Icon && <Icon className="size-4 shrink-0 text-muted-foreground/60" />}
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-semibold tabular-nums">{value}</span>
          {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
        </div>
        {description && (
          <p className="mt-1 truncate text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
