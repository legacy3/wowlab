"use client";

import { Stack } from "styled-system/jsx";

import { PageLayout } from "../shared";
import { MetricsSection } from "./sections";

const NAV = [
  { id: "status", label: "Status" },
  { id: "counters", label: "Counters" },
  { id: "timeline", label: "Timeline" },
];

export function SentinelContent() {
  return (
    <PageLayout nav={NAV}>
      <Stack gap="16">
        <MetricsSection />
      </Stack>
    </PageLayout>
  );
}
