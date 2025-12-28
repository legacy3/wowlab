"use client";

import { useAtomValue } from "jotai";

import { simCastsAtom } from "@/atoms/simulation/results";
import { formatInt } from "@/lib/format";
import { StatCard } from "./stat-card";

export function TotalCastsCard() {
  const casts = useAtomValue(simCastsAtom);

  return (
    <StatCard
      label="Total Casts"
      value={casts !== null ? formatInt(casts) : null}
      subtitle="Abilities executed"
    />
  );
}
