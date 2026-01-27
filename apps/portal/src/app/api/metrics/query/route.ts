import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const RANGE_SECONDS: Record<string, number> = {
  "1h": 3_600,
  "24h": 86_400,
  "6h": 21_600,
  "7d": 604_800,
};

const ALLOWED_METRICS = new Set([
  "centrifugo_broker_redis_pub_sub_buffered_messages",
  "centrifugo_client_connections_accepted",
  "centrifugo_client_connections_inflight",
  "centrifugo_node_messages_received_count",
  "centrifugo_node_messages_sent_count",
  "centrifugo_node_num_channels",
  "centrifugo_node_num_clients",
  "centrifugo_node_num_nodes",
  "centrifugo_node_num_subscriptions",
  "centrifugo_node_num_users",
  "centrifugo_transport_messages_received",
  "centrifugo_transport_messages_received_size",
  "centrifugo_transport_messages_sent",
  "centrifugo_transport_messages_sent_size",
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

  const metricParam = request.nextUrl.searchParams.get("metric");
  const metricsParam = request.nextUrl.searchParams.get("metrics");
  const range = request.nextUrl.searchParams.get("range");
  const step = request.nextUrl.searchParams.get("step") ?? "60";

  const metrics = metricsParam
    ? metricsParam.split(",").filter((m) => ALLOWED_METRICS.has(m))
    : metricParam && ALLOWED_METRICS.has(metricParam)
      ? [metricParam]
      : [];

  if (metrics.length === 0) {
    return NextResponse.json(
      { error: "Invalid or missing metric(s) parameter" },
      { status: 400 },
    );
  }

  const basicAuth = btoa(`${PROMETHEUS_USER}:${PROMETHEUS_TOKEN}`);

  if (!range) {
    const results = await Promise.all(
      metrics.map(async (metric) => {
        const params = new URLSearchParams({ query: metric });
        const response = await fetch(
          `${PROMETHEUS_URL}/api/v1/query?${params}`,
          {
            cache: "no-store",
            headers: { Authorization: `Basic ${basicAuth}` },
          },
        );

        if (!response.ok) {
          return { error: true, metric, value: null };
        }

        const json = await response.json();
        if (json.status !== "success" || !json.data.result.length) {
          return { metric, value: 0 };
        }

        return {
          metric,
          value: Number(json.data.result[0].value[1]),
        };
      }),
    );

    const data: Record<string, number> = {};
    for (const r of results) {
      if (!r.error) {
        data[r.metric] = r.value ?? 0;
      }
    }

    return NextResponse.json({ data, status: "success" });
  }

  if (metrics.length > 1) {
    return NextResponse.json(
      { error: "Range queries only support single metric" },
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
    query: metrics[0],
    start: String(start),
    step,
  });

  const response = await fetch(
    `${PROMETHEUS_URL}/api/v1/query_range?${params}`,
    {
      cache: "no-store",
      headers: { Authorization: `Basic ${basicAuth}` },
    },
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to query Prometheus" },
      { status: 502 },
    );
  }

  return NextResponse.json(await response.json());
}
