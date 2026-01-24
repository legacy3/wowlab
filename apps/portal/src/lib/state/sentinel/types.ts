export type PrometheusQueryResponse = {
  data: {
    result: PrometheusRangeResult[];
    resultType: "matrix" | "vector";
  };
  status: "success" | "error";
};

export type PrometheusRangeResult = {
  metric: Record<string, string>;
  values: PrometheusValue[];
};

export type PrometheusValue = [number, string]; // [unix_timestamp, value_string]

export type SentinelMetricName =
  | "sentinel_chunks_assigned_total"
  | "sentinel_chunks_pending"
  | "sentinel_chunks_reclaimed_total"
  | "sentinel_chunks_running"
  | "sentinel_nodes_marked_offline_total"
  | "sentinel_nodes_online"
  | "sentinel_stale_data_cleanups_total"
  | "sentinel_uptime_seconds";

export type SentinelMetrics = {
  counters: {
    chunks_assigned_total: number;
    chunks_reclaimed_total: number;
    nodes_marked_offline_total: number;
    stale_data_cleanups_total: number;
  };
  gauges: {
    chunks_pending: number;
    chunks_running: number;
    nodes_online: number;
    uptime_seconds: number;
  };
};

export type TimeRange = "1h" | "6h" | "24h" | "7d";

export type TimeSeriesPoint = { x: number; y: number };
