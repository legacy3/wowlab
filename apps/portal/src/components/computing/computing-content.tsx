"use client";

import { Grid, Stack } from "styled-system/jsx";

import { Skeleton } from "@/components/ui";

import {
  CpuCoresCard,
  IterationsCard,
  JobHistoryCard,
  MemoryCard,
  SimulationsCard,
  StatusCard,
  WorkersCard,
} from "./cards";

export function ComputingContent() {
  return (
    <Stack gap="4">
      <Grid columns={{ base: 2, lg: 6, sm: 3 }} gap="4">
        <CpuCoresCard />
        <MemoryCard />
        <WorkersCard />
        <SimulationsCard />
        <IterationsCard />
        <StatusCard />
      </Grid>
      <Grid columns={1} gap="4">
        <JobHistoryCard />
      </Grid>
    </Stack>
  );
}

export function ComputingSkeleton() {
  return (
    <Stack gap="4">
      <Grid columns={{ base: 2, lg: 6, sm: 3 }} gap="4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} h="20" rounded="xl" />
        ))}
      </Grid>
      <Skeleton h="80" rounded="xl" />
    </Stack>
  );
}
