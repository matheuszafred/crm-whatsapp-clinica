import { NextResponse } from "next/server";
import { getOverviewMetrics, getTopPages, getTrafficSources, getLeadEvents } from "@/lib/ga4";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30");

  try {
    const [{ pageviewsRes, whatsappRes, devicesRes }, topPagesRes, sourcesRes, leadsRes] =
      await Promise.all([
        getOverviewMetrics(days),
        getTopPages(days),
        getTrafficSources(days),
        getLeadEvents(days),
      ]);

    // Build timeline map with pageviews + whatsapp
    const timelineMap: Record<string, { date: string; pageviews: number; whatsapp: number; leads: number }> = {};

    for (const row of (pageviewsRes?.rows || [])) {
      const date = row.dimensionValues?.[0].value || "";
      const formatted = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
      timelineMap[formatted] = { date: formatted, pageviews: parseInt(row.metricValues?.[0].value || "0"), whatsapp: 0, leads: 0 };
    }

    for (const row of (whatsappRes?.rows || [])) {
      const date = row.dimensionValues?.[0].value || "";
      const formatted = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
      if (timelineMap[formatted]) {
        timelineMap[formatted].whatsapp = parseInt(row.metricValues?.[0].value || "0");
      } else {
        timelineMap[formatted] = { date: formatted, pageviews: 0, whatsapp: parseInt(row.metricValues?.[0].value || "0"), leads: 0 };
      }
    }

    for (const row of (leadsRes?.rows || [])) {
      const date = row.dimensionValues?.[0].value || "";
      const formatted = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
      if (timelineMap[formatted]) {
        timelineMap[formatted].leads = parseInt(row.metricValues?.[0].value || "0");
      } else {
        timelineMap[formatted] = { date: formatted, pageviews: 0, whatsapp: 0, leads: parseInt(row.metricValues?.[0].value || "0") };
      }
    }

    const timeline = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));

    const totalPageviews = timeline.reduce((sum, d) => sum + d.pageviews, 0);
    const totalWhatsapp = timeline.reduce((sum, d) => sum + d.whatsapp, 0);
    const totalLeads = timeline.reduce((sum, d) => sum + d.leads, 0);
    const conversionRate = totalPageviews > 0 ? ((totalWhatsapp / totalPageviews) * 100).toFixed(1) : "0";

    const devices = (devicesRes?.rows || []).map((row) => ({
      device: row.dimensionValues?.[0].value || "",
      views: parseInt(row.metricValues?.[0].value || "0"),
    }));

    const topPages = (topPagesRes?.rows || []).map((row) => ({
      page: row.dimensionValues?.[0].value || "",
      views: parseInt(row.metricValues?.[0].value || "0"),
    }));

    // Canal label mapping (PT-BR)
    const channelLabels: Record<string, string> = {
      "Organic Search": "Busca Orgânica",
      "Direct": "Direto",
      "Organic Social": "Social Orgânico",
      "Paid Search": "Busca Paga",
      "Referral": "Referência",
      "Email": "E-mail",
      "Paid Social": "Social Pago",
      "Display": "Display",
      "Unassigned": "Não atribuído",
    };

    const sources = (sourcesRes?.rows || []).map((row) => {
      const channel = row.dimensionValues?.[0].value || "";
      return {
        channel: channelLabels[channel] || channel,
        sessions: parseInt(row.metricValues?.[0].value || "0"),
      };
    });

    return NextResponse.json({
      totalPageviews,
      totalWhatsapp,
      totalLeads,
      conversionRate,
      timeline,
      devices,
      topPages,
      sources,
    });
  } catch (error) {
    console.error("GA4 API error:", error);
    return NextResponse.json({ error: "Falha ao buscar dados do GA4" }, { status: 500 });
  }
}
