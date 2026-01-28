"use client";

import { Box } from "styled-system/jsx";

import { Tabs } from "@/components/ui";
import { WasmProvider } from "@/providers";

import { BeaconTab } from "./tabs/beacon-tab";
import { SentinelTab } from "./tabs/sentinel-tab";

export function MetricsContent() {
  return (
    <WasmProvider>
      <Tabs.Root defaultValue="beacon" lazyMount unmountOnExit>
        <Tabs.List mb="6">
          <Tabs.Trigger value="beacon">Beacon</Tabs.Trigger>
          <Tabs.Trigger value="sentinel">Sentinel</Tabs.Trigger>
          <Tabs.Indicator />
        </Tabs.List>

        <Box>
          <Tabs.Content value="beacon">
            <BeaconTab />
          </Tabs.Content>
          <Tabs.Content value="sentinel">
            <SentinelTab />
          </Tabs.Content>
        </Box>
      </Tabs.Root>
    </WasmProvider>
  );
}
