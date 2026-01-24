import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const RANGE_SECONDS: Record<string, number> = {
  "1h": 3_600,
  "24h": 86_400,
  "6h": 21_600,
  "7d": 604_800,
};

const ALLOWED_METRICS = new Set([
  "sentinel_chunks_assigned_total",
  "sentinel_chunks_pending",
  "sentinel_chunks_reclaimed_total",
  "sentinel_chunks_running",
  "sentinel_nodes_marked_offline_total",
  "sentinel_nodes_online",
  "sentinel_stale_data_cleanups_total",
  "sentinel_uptime_seconds",
]);

export async function GET(request: NextRequest) {
  const PROMETHEUS_URL = process.env.GRAFANA_PROMETHEUS_URL;
  const PROMETHEUS_USER = process.env.GRAFANA_PROMETHEUS_USER;
  const PROMETHEUS_TOKEN = process.env.GRAFANA_PROMETHEUS_TOKEN;

  if (!PROMETHEUS_URL || !PROMETHEUS_USER || !PROMETHEUS_TOKEN) {
    return NextResponse.json(
      { error: "Grafana Cloud not configured" },
      { status: 503 },
    );
  }

  const metric = request.nextUrl.searchParams.get("metric");
  const range = request.nextUrl.searchParams.get("range") ?? "1h";
  const step = request.nextUrl.searchParams.get("step") ?? "60";

  if (!metric || !ALLOWED_METRICS.has(metric)) {
    return NextResponse.json(
      { error: "Invalid or missing metric parameter" },
      { status: 400 },
    );
  }

  const rangeSec = RANGE_SECONDS[range];
  if (!rangeSec) {
    return NextResponse.json(
      { error: "Invalid range. Use: 1h, 6h, 24h, 7d" },
      { status: 400 },
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const start = now - rangeSec;

  const params = new URLSearchParams({
    end: String(now),
    query: metric,
    start: String(start),
    step,
  });

  const basicAuth = btoa(`${PROMETHEUS_USER}:${PROMETHEUS_TOKEN}`);

  const response = await fetch(
    `${PROMETHEUS_URL}/api/v1/query_range?${params}`,
    {
      cache: "no-store",
      headers: {
        Authorization: `Basic ${basicAuth}`,
      },
    },
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to query Prometheus" },
      { status: 502 },
    );
  }

  const data = await response.json();

  return NextResponse.json(data);
}
