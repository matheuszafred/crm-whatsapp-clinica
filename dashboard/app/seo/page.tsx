"use client";

import { useEffect, useState } from "react";
import { BarChart3, Eye, MousePointerClick, Target } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PeriodTabs } from "@/components/period-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { SeoTimelineChart } from "@/components/dashboard/SeoTimelineChart";
import { SeoQueriesTable } from "@/components/dashboard/SeoQueriesTable";

interface GscData {
  clicks: number;
  impressions: number;
  ctr: string;
  position: string;
  topPages: { page: string; clicks: number; impressions: number; position: number }[];
  topQueries: { query: string; clicks: number; impressions: number; position: number }[];
  timeline: { date: string; clicks: number; impressions: number }[];
}

export default function SeoPage() {
  const [data, setData] = useState<GscData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(28);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/search-console?days=${days}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <div className="flex h-svh flex-col">
      <PageHeader
        titulo="SEO"
        descricao="Busca orgânica no Google"
        acoes={<PeriodTabs valor={days} onChange={setDays} />}
      />

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 lg:p-6">
        {loading && (
          <div className="text-center py-16 text-sm" style={{ color: "#457ee7" }}>
            Carregando dados do Search Console...
          </div>
        )}

        {error && (
          <div className="text-center py-16 text-red-500 text-sm">Erro: {error}</div>
        )}

        {data && !loading && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <KpiCard
                icon={MousePointerClick}
                title="Cliques"
                value={data.clicks.toLocaleString("pt-BR")}
                description={`Últimos ${days} dias`}
              />
              <KpiCard
                title="Impressões"
                value={data.impressions.toLocaleString("pt-BR")}
                description="Aparições no Google"
                icon={Eye}
              />
              <KpiCard
                title="CTR"
                value={data.ctr}
                suffix="%"
                description="Taxa de clique"
                icon={BarChart3}
              />
              <KpiCard
                title="Posição Média"
                value={`#${data.position}`}
                description="Ranking médio"
                icon={Target}
              />
            </div>

            {/* Timeline */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold" style={{ color: "#282828" }}>
                  Cliques e Impressões ao longo do tempo
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <SeoTimelineChart data={data.timeline} />
              </CardContent>
            </Card>

            {/* Top Queries */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold" style={{ color: "#282828" }}>
                  Top Queries
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <SeoQueriesTable data={data.topQueries} title="Palavras-chave" />
              </CardContent>
            </Card>

            {/* Top Pages */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold" style={{ color: "#282828" }}>
                  Top Páginas
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <SeoQueriesTable data={data.topPages.map(p => ({ ...p, query: p.page }))} title="Páginas por cliques" />
              </CardContent>
            </Card>
          </>
        )}

        <p className="text-center text-xs pb-4" style={{ color: "#aaa" }}>
          Dados via Google Search Console · Daedalus
        </p>
      </div>
    </div>
  );
}
