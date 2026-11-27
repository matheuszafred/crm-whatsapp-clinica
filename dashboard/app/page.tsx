"use client";

import { useEffect, useState } from "react";
import { Eye, MessageCircle, Target, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PeriodTabs } from "@/components/period-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { TrafficChart } from "@/components/dashboard/TrafficChart";
import { TopPagesChart } from "@/components/dashboard/TopPagesChart";
import { DevicesChart } from "@/components/dashboard/DevicesChart";
import { TrafficSourceChart } from "@/components/dashboard/TrafficSourceChart";

interface AnalyticsData {
  totalPageviews: number;
  totalWhatsapp: number;
  totalLeads: number;
  conversionRate: string;
  timeline: { date: string; pageviews: number; whatsapp: number; leads: number }[];
  devices: { device: string; views: number }[];
  topPages: { page: string; views: number }[];
  sources: { channel: string; sessions: number }[];
}

export default function Dashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/analytics?days=${days}`)
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
        titulo="Analytics"
        descricao="Tráfego e comportamento no site"
        acoes={<PeriodTabs valor={days} onChange={setDays} />}
      />

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 lg:p-6">
        {loading && (
          <div className="text-center py-16 text-sm" style={{ color: "#457ee7" }}>
            Carregando dados...
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
                title="Pageviews"
                value={data.totalPageviews.toLocaleString("pt-BR")}
                description={`Últimos ${days} dias`}
                icon={Eye}
              />
              <KpiCard
                title="WhatsApp"
                value={data.totalWhatsapp.toLocaleString("pt-BR")}
                description="Cliques no botão"
                icon={MessageCircle}
              />
              <KpiCard
                title="Conversão"
                value={data.conversionRate}
                suffix="%"
                description="Visitas → WhatsApp"
                icon={TrendingUp}
              />
              <KpiCard
                title="Leads"
                value={(data.totalLeads ?? 0).toLocaleString("pt-BR")}
                description="Evento generate_lead"
                icon={Target}
              />
            </div>

            {/* Traffic timeline */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold" style={{ color: "#282828" }}>
                  Tráfego ao longo do tempo
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <TrafficChart data={data.timeline} />
              </CardContent>
            </Card>

            {/* Traffic sources */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold" style={{ color: "#282828" }}>
                  Canais de origem
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <TrafficSourceChart data={data.sources} />
              </CardContent>
            </Card>

            {/* Top pages */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold" style={{ color: "#282828" }}>
                  Páginas mais visitadas
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <TopPagesChart data={data.topPages} />
              </CardContent>
            </Card>

            {/* Devices */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold" style={{ color: "#282828" }}>
                  Dispositivos
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <DevicesChart data={data.devices} />
              </CardContent>
            </Card>
          </>
        )}

        <p className="text-center text-xs pb-4" style={{ color: "#aaa" }}>
          Dados via Google Analytics · Daedalus
        </p>
      </div>
    </div>
  );
}
