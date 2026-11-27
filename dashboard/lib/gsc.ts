const GSC_SITE_URL = "https://www.exemplo.com.br/";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GSC_API = "https://searchconsole.googleapis.com/webmasters/v3";

async function getAccessToken(): Promise<string> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN_GSC!,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Falha ao obter access token GSC");
  return data.access_token;
}

function dateRange(days: number): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

async function query(token: string, body: object) {
  const res = await fetch(`${GSC_API}/sites/${encodeURIComponent(GSC_SITE_URL)}/searchAnalytics/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function getGscOverview(days: number) {
  const token = await getAccessToken();
  const { startDate, endDate } = dateRange(days);

  const [overview, byPage, byQuery, byDate] = await Promise.all([
    // Totais gerais
    query(token, { startDate, endDate, dimensions: [] }),
    // Top páginas
    query(token, { startDate, endDate, dimensions: ["page"], rowLimit: 10 }),
    // Top queries
    query(token, { startDate, endDate, dimensions: ["query"], rowLimit: 10 }),
    // Timeline
    query(token, { startDate, endDate, dimensions: ["date"], rowLimit: days }),
  ]);

  const totals = overview.rows?.[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };

  return {
    clicks: totals.clicks ?? 0,
    impressions: totals.impressions ?? 0,
    ctr: ((totals.ctr ?? 0) * 100).toFixed(1),
    position: (totals.position ?? 0).toFixed(1),
    topPages: (byPage.rows ?? []).map((r: any) => ({
      page: r.keys[0].replace("https://www.exemplo.com.br", "") || "/",
      clicks: r.clicks,
      impressions: r.impressions,
      position: parseFloat(r.position.toFixed(1)),
    })),
    topQueries: (byQuery.rows ?? []).map((r: any) => ({
      query: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
      position: parseFloat(r.position.toFixed(1)),
    })),
    timeline: (byDate.rows ?? []).map((r: any) => ({
      date: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
    })),
  };
}
