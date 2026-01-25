// Prometheus API response types

export type BeaconMetricName =
  // Gauges
  | "centrifugo_broker_redis_pub_sub_buffered_messages"
  | "centrifugo_client_connections_inflight"
  | "centrifugo_node_num_channels"
  | "centrifugo_node_num_clients"
  | "centrifugo_node_num_nodes"
  | "centrifugo_node_num_subscriptions"
  | "centrifugo_node_num_users"
  // Counters
  | "centrifugo_client_connections_accepted"
  | "centrifugo_node_messages_received_count"
  | "centrifugo_node_messages_sent_count"
  | "centrifugo_transport_messages_received"
  | "centrifugo_transport_messages_received_size"
  | "centrifugo_transport_messages_sent"
  | "centrifugo_transport_messages_sent_size";

export type BeaconMetrics = {
  connections: {
    clients: number;
    channels: number;
    subscriptions: number;
    users: number;
    inflight: number;
  };
  messages: {
    sent_total: number;
    received_total: number;
  };
};

export type MetricName = SentinelMetricName | BeaconMetricName;

// Time range options for charts

export type PrometheusQueryResponse = {
  data: {
    result: PrometheusRangeResult[];
    resultType: "matrix" | "vector";
  };
  status: "success" | "error";
};

// Chart data points

export type PrometheusRangeResult = {
  metric: Record<string, string>;
  values: PrometheusValue[];
};

// Sentinel metric names

export type PrometheusValue = [number, string]; // [unix_timestamp, value_string]

// Sentinel metrics structure

export type SentinelMetricName =
  | "sentinel_chunks_assigned_total"
  | "sentinel_chunks_pending"
  | "sentinel_chunks_reclaimed_total"
  | "sentinel_chunks_running"
  | "sentinel_nodes_marked_offline_total"
  | "sentinel_nodes_online"
  | "sentinel_stale_data_cleanups_total"
  | "sentinel_uptime_seconds";

// Beacon (Centrifugo) metric names

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

// Beacon metrics structure

export type TimeRange = "1h" | "6h" | "24h" | "7d";

// Combined metric name type for API validation

export type TimeSeriesPoint = { x: number; y: number };
