"use client";

import { Clock, Layers, Server, Zap } from "lucide-react";
import { useState } from "react";
import { Grid, Stack } from "styled-system/jsx";

import { StatCard, Text } from "@/components/ui";
import {
  type TimeRange,
  useSentinelRange,
  useSentinelStatus,
} from "@/lib/state";

import {
  ErrorState,
  MetricsChart,
  NotConfigured,
  RangeSelector,
} from "../shared";

export function SentinelTab() {
  const { data: metrics, error } = useSentinelStatus();

  if (error) {
    return <ErrorState message={error.message} />;
  }

  return (
    <Stack gap="6">
      {/* Gauges */}
      <Grid columns={{ base: 2, md: 4 }} gap="3">
        <StatCard
          icon={Server}
          label="Nodes Online"
          value={metrics.gauges.nodes_online}
        />
        <StatCard
          icon={Clock}
          label="Uptime"
          value={formatUptime(metrics.gauges.uptime_seconds)}
        />
        <StatCard
          icon={Layers}
          label="Pending"
          value={metrics.gauges.chunks_pending}
        />
        <StatCard
          icon={Zap}
          label="Running"
          value={metrics.gauges.chunks_running}
        />
      </Grid>

      {/* Counters */}
      <Grid columns={{ base: 2, md: 4 }} gap="3">
        <CounterStat
          label="Chunks Assigned"
          value={metrics.counters.chunks_assigned_total}
        />
        <CounterStat
          label="Chunks Reclaimed"
          value={metrics.counters.chunks_reclaimed_total}
        />
        <CounterStat
          label="Nodes Offline"
          value={metrics.counters.nodes_marked_offline_total}
        />
        <CounterStat
          label="Stale Cleanups"
          value={metrics.counters.stale_data_cleanups_total}
        />
      </Grid>

      {/* Charts */}
      <SentinelCharts />
    </Stack>
  );
}

function CounterStat({ label, value }: { label: string; value: number }) {
  return (
    <Stack gap="0.5" p="3" bg="bg.subtle" rounded="l2">
      <Text textStyle="xs" color="fg.subtle">
        {label}
      </Text>
      <Text fontWeight="semibold" fontFamily="mono">
        {value.toLocaleString()}
      </Text>
    </Stack>
  );
}

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  return `${minutes}m`;
}

function SentinelCharts() {
  const [range, setRange] = useState<TimeRange>("1h");

  const nodesOnline = useSentinelRange("sentinel_nodes_online", range);
  const chunksRunning = useSentinelRange("sentinel_chunks_running", range);
  const chunksPending = useSentinelRange("sentinel_chunks_pending", range);

  const notConfigured =
    nodesOnline.error?.message?.includes("503") ||
    nodesOnline.error?.message?.includes("not configured");

  if (notConfigured) {
    return <NotConfigured service="Grafana" />;
  }

  return (
    <Stack gap="4">
      <RangeSelector value={range} onChange={setRange} />

      <Grid columns={{ base: 1, lg: 2 }} gap="4">
        <MetricsChart
          title="Nodes Online"
          data={nodesOnline.data}
          isLoading={nodesOnline.isLoading}
          error={nodesOnline.error}
        />

        <MetricsChart
          title="Chunks"
          data={[chunksRunning.data, chunksPending.data]}
          labels={["Running", "Pending"]}
          isLoading={chunksRunning.isLoading || chunksPending.isLoading}
        />
      </Grid>
    </Stack>
  );
}
