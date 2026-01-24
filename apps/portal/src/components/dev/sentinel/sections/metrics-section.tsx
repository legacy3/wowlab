"use client";

import { Activity, Clock, Layers, Server, Zap } from "lucide-react";
import { useState } from "react";
import { Grid, HStack, Stack } from "styled-system/jsx";

import { Badge, Button, StatCard, Text } from "@/components/ui";
import { BarChart, LineChart } from "@/components/ui/charts";
import {
  type SentinelMetrics,
  type TimeRange,
  type TimeSeriesPoint,
  useSentinelRange,
  useSentinelStatus,
} from "@/lib/state";

import { DemoBox, DemoLabel, Section, Subsection } from "../../shared";

export function MetricsSection() {
  const { data: metrics, error, isLoading } = useSentinelStatus();

  if (isLoading) {
    return (
      <Section id="status" title="Sentinel Status">
        <DemoBox>
          <Text color="fg.muted">Loading metrics...</Text>
        </DemoBox>
      </Section>
    );
  }

  if (error || !metrics) {
    return (
      <Section id="status" title="Sentinel Status">
        <DemoBox>
          <HStack gap="3">
            <Badge colorPalette="red">Error</Badge>
            <Text color="fg.error" textStyle="sm">
              {error?.message ?? "Failed to load metrics"}
            </Text>
          </HStack>
        </DemoBox>
      </Section>
    );
  }

  return (
    <>
      <StatusSubsection metrics={metrics} />
      <CountersSubsection metrics={metrics} />
      <TimelineSubsection />
    </>
  );
}

function CountersSubsection({ metrics }: { metrics: SentinelMetrics }) {
  const data = [
    { label: "Offline", value: metrics.counters.nodes_marked_offline_total },
    { label: "Assigned", value: metrics.counters.chunks_assigned_total },
    { label: "Reclaimed", value: metrics.counters.chunks_reclaimed_total },
    { label: "Cleanups", value: metrics.counters.stale_data_cleanups_total },
  ];

  return (
    <Section id="counters" title="Counters">
      <Subsection title="Cumulative Totals">
        <DemoBox>
          <DemoLabel>Lifetime event counts</DemoLabel>
          <BarChart data={data} width={480} height={240} gradient />
        </DemoBox>
      </Subsection>
    </Section>
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

function StatusSubsection({ metrics }: { metrics: SentinelMetrics }) {
  const isHealthy = metrics.gauges.nodes_online > 0;

  return (
    <Section id="status" title="Sentinel Status">
      <Stack gap="6">
        <Subsection title="Health">
          <DemoBox>
            <HStack gap="3">
              <Badge colorPalette={isHealthy ? "green" : "amber"}>
                {isHealthy ? "Healthy" : "Degraded"}
              </Badge>
              <Text color="fg.muted" textStyle="sm">
                Uptime: {formatUptime(metrics.gauges.uptime_seconds)}
              </Text>
            </HStack>
          </DemoBox>
        </Subsection>

        <Subsection title="Gauges">
          <Grid columns={{ base: 2, md: 4 }} gap="4">
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
              label="Chunks Pending"
              value={metrics.gauges.chunks_pending}
            />
            <StatCard
              icon={Zap}
              label="Chunks Running"
              value={metrics.gauges.chunks_running}
            />
          </Grid>
        </Subsection>
      </Stack>
    </Section>
  );
}

const RANGES: { label: string; value: TimeRange }[] = [
  { label: "1h", value: "1h" },
  { label: "6h", value: "6h" },
  { label: "24h", value: "24h" },
  { label: "7d", value: "7d" },
];

function MultiTimelineChart({
  isLoading,
  series,
}: {
  series: (TimeSeriesPoint[] | undefined)[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Text color="fg.muted" textStyle="sm">
        Loading...
      </Text>
    );
  }

  const validSeries = series.filter(
    (s): s is TimeSeriesPoint[] => !!s && s.length >= 2,
  );

  if (validSeries.length === 0) {
    return (
      <Text color="fg.muted" textStyle="sm">
        Not enough data points yet.
      </Text>
    );
  }

  const normalized = validSeries.map((s) =>
    s.map((p, i) => ({ x: i, y: p.y })),
  );

  return (
    <LineChart
      data={normalized.length === 1 ? normalized[0] : normalized}
      width={480}
      height={200}
      showDots={validSeries[0].length <= 30}
    />
  );
}

function TimelineChart({
  data,
  isLoading,
}: {
  data: TimeSeriesPoint[] | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Text color="fg.muted" textStyle="sm">
        Loading...
      </Text>
    );
  }

  if (!data || data.length < 2) {
    return (
      <Text color="fg.muted" textStyle="sm">
        Not enough data points yet.
      </Text>
    );
  }

  const normalized = data.map((p, i) => ({ x: i, y: p.y }));

  return (
    <LineChart
      data={normalized}
      width={480}
      height={200}
      showDots={data.length <= 30}
    />
  );
}

function TimelineSubsection() {
  const [range, setRange] = useState<TimeRange>("1h");

  const nodesOnline = useSentinelRange("sentinel_nodes_online", range);
  const chunksRunning = useSentinelRange("sentinel_chunks_running", range);
  const chunksPending = useSentinelRange("sentinel_chunks_pending", range);

  const isConfigured =
    !nodesOnline.error?.message?.includes("503") &&
    !nodesOnline.error?.message?.includes("not configured");

  if (nodesOnline.error && !isConfigured) {
    return (
      <Section id="timeline" title="Timeline">
        <Subsection title="Historical Data">
          <DemoBox>
            <HStack gap="3">
              <Activity size={16} color="var(--colors-fg-muted)" />
              <Text color="fg.muted" textStyle="sm">
                Grafana Cloud not configured. Set GRAFANA_PROMETHEUS_URL and
                GRAFANA_API_TOKEN to enable historical charts.
              </Text>
            </HStack>
          </DemoBox>
        </Subsection>
      </Section>
    );
  }

  return (
    <Section id="timeline" title="Timeline">
      <Stack gap="6">
        <HStack gap="2">
          {RANGES.map((r) => (
            <Button
              key={r.value}
              size="xs"
              variant={range === r.value ? "solid" : "outline"}
              onClick={() => setRange(r.value)}
            >
              {r.label}
            </Button>
          ))}
        </HStack>

        <Subsection title="Nodes Online">
          <DemoBox>
            <TimelineChart
              data={nodesOnline.data}
              isLoading={nodesOnline.isLoading}
            />
          </DemoBox>
        </Subsection>

        <Subsection title="Chunks Activity">
          <DemoBox>
            <DemoLabel>Running vs Pending</DemoLabel>
            <MultiTimelineChart
              series={[chunksRunning.data, chunksPending.data]}
              isLoading={chunksRunning.isLoading || chunksPending.isLoading}
            />
          </DemoBox>
        </Subsection>
      </Stack>
    </Section>
  );
}
