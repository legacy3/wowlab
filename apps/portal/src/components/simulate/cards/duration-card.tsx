"use client";

import { useAtomValue } from "jotai";

import { simDurationAtom } from "@/atoms/simulation/results";
import { StatCard } from "./stat-card";

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);

  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }

  return `${secs}s`;
}

export function DurationCard() {
  const duration = useAtomValue(simDurationAtom);

  return (
    <StatCard
      label="Duration"
      value={duration !== null ? formatDuration(duration) : null}
      subtitle="Encounter length"
    />
  );
}
