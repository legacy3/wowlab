"use client";

import { Stack } from "styled-system/jsx";

import { Skeleton } from "@/components/ui";

import { JobHistoryCard } from "./cards";

export function ComputingContent() {
  return (
    <Stack gap="4">
      <JobHistoryCard />
    </Stack>
  );
}

export function ComputingSkeleton() {
  return (
    <Stack gap="4">
      <Skeleton h="80" rounded="xl" />
    </Stack>
  );
}
