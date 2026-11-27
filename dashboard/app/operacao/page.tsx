"use client";

import { useEffect, useState } from "react";
import { Activity, Bell, MessageCircle, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PeriodTabs } from "@/components/period-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { LeadsTimelineChart } from "@/components/dashboard/LeadsTimelineChart";
import { LeadOriginChart } from "@/components/dashboard/LeadOriginChart";
import { LeadFunnel } from "@/components/dashboard/LeadFunnel";

interface OperacaoData {
  leadsPeriodo: number;
  leadsHoje: number;
  baseTotal: number;
  ativosPeriodo: number;
  byDay: { date: string; leads: number }[];
  byOrigin: { origin: string; label: string; leads: number }[];
  byStage: { stage: string; label: string; leads: number; pct: number }[];
}

export default function OperacaoPage() {
  const [data, setData] = useState<OperacaoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(28);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/operacao?days=${days}`)
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
        titulo="Operação"
        descricao="Leads do WhatsApp"
        acoes={<PeriodTabs valor={days} onChange={setDays} />}
      />

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 lg:p-6">
        {loading && (
          <div className="text-center py-16 text-sm" style={{ color: "#25d366" }}>
            Carregando leads do WhatsApp...
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
                title="Leads no período"
                value={data.leadsPeriodo.toLocaleString("pt-BR")}
                description={`Últimos ${days} dias`}
                icon={MessageCircle}
              />
              <KpiCard
                icon={Bell}
                title="Novos hoje"
                value={data.leadsHoje.toLocaleString("pt-BR")}
                description="Primeiro contato hoje"
              />
              <KpiCard
                icon={Activity}
                title="Conversas ativas"
                value={data.ativosPeriodo.toLocaleString("pt-BR")}
                description="Falaram no período"
              />
              <KpiCard
                icon={Users}
                title="Base total"
                value={data.baseTotal.toLocaleString("pt-BR")}
                description="Desde o início"
              />
            </div>

            {/* Leads por dia */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold" style={{ color: "#282828" }}>
                  Leads por dia
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <LeadsTimelineChart data={data.byDay} />
              </CardContent>
            </Card>

            {/* Origem */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold" style={{ color: "#282828" }}>
                  De onde vieram
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <LeadOriginChart data={data.byOrigin} />
              </CardContent>
            </Card>

            {/* Funil */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold" style={{ color: "#282828" }}>
                  Funil de atendimento
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <LeadFunnel data={data.byStage} />
              </CardContent>
            </Card>
          </>
        )}

        <p className="text-center text-xs pb-4" style={{ color: "#aaa" }}>
          Leads do WhatsApp via Supabase · Daedalus
        </p>
      </div>
    </div>
  );
}
