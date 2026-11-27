import { BetaAnalyticsDataClient } from "@google-analytics/data";

const propertyId = process.env.GA4_PROPERTY_ID!;

function getClient() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY!;
  const credentials = JSON.parse(keyJson);
  return new BetaAnalyticsDataClient({ credentials });
}

export async function getOverviewMetrics(days = 30) {
  const client = getClient();
  const startDate = `${days}daysAgo`;

  const [[pageviewsRes], [whatsappRes], [devicesRes]] = await Promise.all([
    client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate: "today" }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "screenPageViews" }],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    }),
    client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate: "today" }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          stringFilter: { value: "whatsapp_click" },
        },
      },
      orderBys: [{ dimension: { dimensionName: "date" } }],
    }),
    client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate: "today" }],
      dimensions: [{ name: "deviceCategory" }],
      metrics: [{ name: "screenPageViews" }],
    }),
  ]);

  return { pageviewsRes, whatsappRes, devicesRes };
}

export async function getTopPages(days = 30) {
  const client = getClient();
  const [res] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "screenPageViews" }],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: 10,
  });
  return res;
}

export async function getTrafficSources(days = 30) {
  const client = getClient();
  const [res] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "sessionDefaultChannelGroup" }],
    metrics: [{ name: "sessions" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
  });
  return res;
}

export async function getLeadEvents(days = 30) {
  const client = getClient();
  const startDate = `${days}daysAgo`;

  const [res] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate: "today" }],
    dimensions: [{ name: "date" }],
    metrics: [{ name: "eventCount" }],
    dimensionFilter: {
      filter: {
        fieldName: "eventName",
        stringFilter: { value: "generate_lead" },
      },
    },
    orderBys: [{ dimension: { dimensionName: "date" } }],
  });
  return res;
}
