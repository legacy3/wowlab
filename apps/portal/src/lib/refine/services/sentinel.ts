"use client";

import { useCustom } from "@refinedev/core";

import type {
  PrometheusQueryResponse,
  SentinelMetricName,
  SentinelMetrics,
  TimeRange,
  TimeSeriesPoint,
} from "../../state/sentinel/types";

function parsePrometheusText(text: string): SentinelMetrics | null {
  const values: Record<string, number> = {};

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const [name, val] = trimmed.split(/\s+/);
    if (name && val) {
      values[name] = Number(val);
    }
  }

  if (Object.keys(values).length === 0) {
    return null;
  }

  return {
    counters: {
      chunks_assigned_total: values["sentinel_chunks_assigned_total"] ?? 0,
      chunks_reclaimed_total: values["sentinel_chunks_reclaimed_total"] ?? 0,
      nodes_marked_offline_total:
        values["sentinel_nodes_marked_offline_total"] ?? 0,
      stale_data_cleanups_total:
        values["sentinel_stale_data_cleanups_total"] ?? 0,
    },
    gauges: {
      chunks_pending: values["sentinel_chunks_pending"] ?? 0,
      chunks_running: values["sentinel_chunks_running"] ?? 0,
      nodes_online: values["sentinel_nodes_online"] ?? 0,
      uptime_seconds: values["sentinel_uptime_seconds"] ?? 0,
    },
  };
}

const RANGE_STEPS: Record<TimeRange, number> = {
  "1h": 30,
  "24h": 300,
  "6h": 120,
  "7d": 1800,
};

export function useSentinelRange(
  metric: SentinelMetricName,
  range: TimeRange = "1h",
) {
  const result = useCustom<TimeSeriesPoint[]>({
    method: "get",
    queryOptions: {
      queryFn: async (): Promise<{ data: TimeSeriesPoint[] }> => {
        const params = new URLSearchParams({
          metric,
          range,
          step: String(RANGE_STEPS[range]),
        });

        const res = await fetch(`/api/sentinel/query?${params}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json: PrometheusQueryResponse = await res.json();
        if (json.status !== "success" || !json.data.result.length) {
          return { data: [] };
        }

        return {
          data: json.data.result[0].values.map(([ts, val]) => ({
            x: ts,
            y: Number(val),
          })),
        };
      },
      refetchInterval: RANGE_STEPS[range] * 1000,
      staleTime: RANGE_STEPS[range] * 1000,
    },
    url: `/api/sentinel/query?metric=${metric}&range=${range}`,
  });

  return {
    data: result.query.data?.data ?? [],
    error: result.query.error,
    isError: result.query.isError,
    isLoading: result.query.isLoading,
  };
}

export function useSentinelStatus() {
  const result = useCustom<SentinelMetrics>({
    method: "get",
    queryOptions: {
      queryFn: async (): Promise<{ data: SentinelMetrics }> => {
        const res = await fetch("/api/sentinel/metrics");

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const text = await res.text();
        const parsed = parsePrometheusText(text);

        if (!parsed) {
          throw new Error("Failed to parse metrics");
        }

        return { data: parsed };
      },
      refetchInterval: 30_000,
      staleTime: 10_000,
    },
    url: "/api/sentinel/metrics",
  });

  return {
    data: result.query.data?.data ?? {
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
    },
    error: result.query.error,
    isError: result.query.isError,
    isLoading: result.query.isLoading,
  };
}
