"use client";

import { Activity, Hash, Inbox, Radio, Send, Users } from "lucide-react";
import { useState } from "react";
import { Grid, HStack, Stack } from "styled-system/jsx";

import { StatCard, Text } from "@/components/ui";
import { type TimeRange, useBeaconRange, useBeaconStatus } from "@/lib/state";

import {
  AnalyticsChart,
  ChartCard,
  ErrorState,
  NotConfigured,
  RangeSelector,
  TimeSeriesChart,
} from "../shared";

export function BeaconTab() {
  const { data: metrics, error } = useBeaconStatus();

  if (error) {
    return <ErrorState message={error.message} />;
  }

  return (
    <Stack gap="6">
      {/* Connection stats */}
      <Grid columns={{ base: 2, md: 5 }} gap="3">
        <StatCard
          icon={Users}
          label="Clients"
          value={metrics.connections.clients}
        />
        <StatCard
          icon={Hash}
          label="Channels"
          value={metrics.connections.channels}
        />
        <StatCard
          icon={Radio}
          label="Subscriptions"
          value={metrics.connections.subscriptions}
        />
        <StatCard
          icon={Users}
          label="Users"
          value={metrics.connections.users}
        />
        <StatCard
          icon={Activity}
          label="Connecting"
          value={metrics.connections.inflight}
        />
      </Grid>

      {/* Message stats */}
      <Grid columns={2} gap="3">
        <MessageStat
          icon={Send}
          label="Messages Sent"
          value={metrics.messages.sent_total}
        />
        <MessageStat
          icon={Inbox}
          label="Messages Received"
          value={metrics.messages.received_total}
        />
      </Grid>

      {/* Charts */}
      <BeaconCharts />
    </Stack>
  );
}

function BeaconCharts() {
  const [range, setRange] = useState<TimeRange>("1h");

  // Connection gauges
  const clients = useBeaconRange("centrifugo_node_num_clients", range);
  const channels = useBeaconRange("centrifugo_node_num_channels", range);
  const subscriptions = useBeaconRange(
    "centrifugo_node_num_subscriptions",
    range,
  );
  const users = useBeaconRange("centrifugo_node_num_users", range);

  // Message counters
  const messagesSent = useBeaconRange(
    "centrifugo_node_messages_sent_count",
    range,
  );
  const messagesReceived = useBeaconRange(
    "centrifugo_node_messages_received_count",
    range,
  );

  // Transport metrics
  const transportSent = useBeaconRange(
    "centrifugo_transport_messages_sent",
    range,
  );
  const transportReceived = useBeaconRange(
    "centrifugo_transport_messages_received",
    range,
  );
  const bytesSent = useBeaconRange(
    "centrifugo_transport_messages_sent_size",
    range,
  );
  const bytesReceived = useBeaconRange(
    "centrifugo_transport_messages_received_size",
    range,
  );

  const notConfigured =
    clients.error?.message?.includes("503") ||
    clients.error?.message?.includes("not configured");

  if (notConfigured) {
    return <NotConfigured service="Grafana" />;
  }

  return (
    <Stack gap="4">
      <RangeSelector value={range} onChange={setRange} />

      <Grid columns={{ base: 1, lg: 2 }} gap="4">
        {/* Connection metrics - single series with analytics */}
        <AnalyticsChart
          title="Connected Clients"
          data={clients.data}
          isLoading={clients.isLoading}
          error={clients.error}
        />

        <AnalyticsChart
          title="Unique Users"
          data={users.data}
          isLoading={users.isLoading}
          error={users.error}
        />

        <AnalyticsChart
          title="Channels"
          data={channels.data}
          isLoading={channels.isLoading}
          error={channels.error}
        />

        <AnalyticsChart
          title="Subscriptions"
          data={subscriptions.data}
          isLoading={subscriptions.isLoading}
          error={subscriptions.error}
        />

        {/* Multi-series comparisons - plain charts */}
        <ChartCard title="Broker Messages (Sent vs Received)">
          <TimeSeriesChart
            data={[messagesSent.data, messagesReceived.data]}
            isLoading={messagesSent.isLoading || messagesReceived.isLoading}
          />
        </ChartCard>

        <ChartCard title="Transport Messages (Sent vs Received)">
          <TimeSeriesChart
            data={[transportSent.data, transportReceived.data]}
            isLoading={transportSent.isLoading || transportReceived.isLoading}
          />
        </ChartCard>

        <ChartCard title="Bandwidth (Bytes Sent vs Received)">
          <TimeSeriesChart
            data={[bytesSent.data, bytesReceived.data]}
            isLoading={bytesSent.isLoading || bytesReceived.isLoading}
          />
        </ChartCard>
      </Grid>
    </Stack>
  );
}

function MessageStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Send;
  label: string;
  value: number;
}) {
  return (
    <HStack gap="3" p="4" bg="bg.subtle" rounded="l2">
      <Icon size={20} color="var(--colors-fg-muted)" />
      <Stack gap="0">
        <Text textStyle="xs" color="fg.subtle">
          {label}
        </Text>
        <Text fontWeight="semibold" fontFamily="mono">
          {value.toLocaleString()}
        </Text>
      </Stack>
    </HStack>
  );
}
