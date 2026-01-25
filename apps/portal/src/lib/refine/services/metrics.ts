"use client";

import { useQuery } from "@tanstack/react-query";

import type {
  BeaconMetricName,
  BeaconMetrics,
  MetricName,
  PrometheusQueryResponse,
  SentinelMetricName,
  SentinelMetrics,
  TimeRange,
  TimeSeriesPoint,
} from "../../state/metrics/types";

// =============================================================================
// Constants
// =============================================================================

const SENTINEL_METRICS = [
  "sentinel_chunks_assigned_total",
  "sentinel_chunks_reclaimed_total",
  "sentinel_nodes_marked_offline_total",
  "sentinel_stale_data_cleanups_total",
  "sentinel_chunks_pending",
  "sentinel_chunks_running",
  "sentinel_nodes_online",
  "sentinel_uptime_seconds",
] as const;

const BEACON_METRICS = [
  "centrifugo_node_num_clients",
  "centrifugo_node_num_channels",
  "centrifugo_node_num_subscriptions",
  "centrifugo_node_num_users",
  "centrifugo_client_connections_inflight",
  "centrifugo_node_messages_sent_count",
  "centrifugo_node_messages_received_count",
] as const;

const RANGE_STEPS: Record<TimeRange, number> = {
  "1h": 30,
  "24h": 300,
  "6h": 120,
  "7d": 1800,
};

const DEFAULT_BEACON: BeaconMetrics = {
  connections: {
    channels: 0,
    clients: 0,
    inflight: 0,
    subscriptions: 0,
    users: 0,
  },
  messages: { received_total: 0, sent_total: 0 },
};

const DEFAULT_SENTINEL: SentinelMetrics = {
  counters: {
    chunks_assigned_total: 0,
    chunks_reclaimed_total: 0,
    nodes_marked_offline_total: 0,
    stale_data_cleanups_total: 0,
  },
  gauges: {
    chunks_pending: 0,
    chunks_running: 0,
    nodes_online: 0,
    uptime_seconds: 0,
  },
};

// =============================================================================
// Fetchers
// =============================================================================

export function useBeaconRange(
  metric: BeaconMetricName,
  range: TimeRange = "1h",
) {
  return useMetricsRange(metric, range);
}

export function useBeaconStatus() {
  const query = useQuery({
    queryFn: fetchBeaconMetrics,
    queryKey: ["metrics", "beacon", "status"],
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  return {
    data: query.data ?? DEFAULT_BEACON,
    error: query.error,
    isError: query.isError,
    isLoading: query.isLoading,
  };
}

export function useMetricsRange(metric: MetricName, range: TimeRange = "1h") {
  const query = useQuery({
    queryFn: () => fetchMetricRange(metric, range),
    queryKey: ["metrics", "range", metric, range],
    refetchInterval: RANGE_STEPS[range] * 1000,
    staleTime: RANGE_STEPS[range] * 1000,
  });

  return {
    data: query.data ?? [],
    error: query.error,
    isError: query.isError,
    isLoading: query.isLoading,
  };
}

// =============================================================================
// Hooks
// =============================================================================

export function useSentinelRange(
  metric: SentinelMetricName,
  range: TimeRange = "1h",
) {
  return useMetricsRange(metric, range);
}

export function useSentinelStatus() {
  const query = useQuery({
    queryFn: fetchSentinelMetrics,
    queryKey: ["metrics", "sentinel", "status"],
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  return {
    data: query.data ?? DEFAULT_SENTINEL,
    error: query.error,
    isError: query.isError,
    isLoading: query.isLoading,
  };
}

async function fetchBeaconMetrics(): Promise<BeaconMetrics> {
  const res = await fetch(
    `/api/metrics/query?metrics=${BEACON_METRICS.join(",")}`,
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json: { data: Record<string, number> } = await res.json();
  const d = json.data;

  return {
    connections: {
      channels: d["centrifugo_node_num_channels"] ?? 0,
      clients: d["centrifugo_node_num_clients"] ?? 0,
      inflight: d["centrifugo_client_connections_inflight"] ?? 0,
      subscriptions: d["centrifugo_node_num_subscriptions"] ?? 0,
      users: d["centrifugo_node_num_users"] ?? 0,
    },
    messages: {
      received_total: d["centrifugo_node_messages_received_count"] ?? 0,
      sent_total: d["centrifugo_node_messages_sent_count"] ?? 0,
    },
  };
}

async function fetchMetricRange(
  metric: MetricName,
  range: TimeRange,
): Promise<TimeSeriesPoint[]> {
  const params = new URLSearchParams({
    metric,
    range,
    step: String(RANGE_STEPS[range]),
  });

  const res = await fetch(`/api/metrics/query?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json: PrometheusQueryResponse = await res.json();
  if (json.status !== "success" || !json.data.result.length) {
    return [];
  }

  return json.data.result[0].values.map(([ts, val]) => ({
    x: ts,
    y: Number(val),
  }));
}

async function fetchSentinelMetrics(): Promise<SentinelMetrics> {
  const res = await fetch(
    `/api/metrics/query?metrics=${SENTINEL_METRICS.join(",")}`,
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json: { data: Record<string, number> } = await res.json();
  const d = json.data;

  return {
    counters: {
      chunks_assigned_total: d["sentinel_chunks_assigned_total"] ?? 0,
      chunks_reclaimed_total: d["sentinel_chunks_reclaimed_total"] ?? 0,
      nodes_marked_offline_total: d["sentinel_nodes_marked_offline_total"] ?? 0,
      stale_data_cleanups_total: d["sentinel_stale_data_cleanups_total"] ?? 0,
    },
    gauges: {
      chunks_pending: d["sentinel_chunks_pending"] ?? 0,
      chunks_running: d["sentinel_chunks_running"] ?? 0,
      nodes_online: d["sentinel_nodes_online"] ?? 0,
      uptime_seconds: d["sentinel_uptime_seconds"] ?? 0,
    },
  };
}
