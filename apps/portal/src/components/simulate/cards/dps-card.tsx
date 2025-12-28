"use client";

import { useAtomValue } from "jotai";

import { simDpsAtom } from "@/atoms/simulation/results";
import { formatInt } from "@/lib/format";
import { StatCard } from "./stat-card";

export function DpsCard() {
  const dps = useAtomValue(simDpsAtom);

  return (
    <StatCard
      label="Simulated DPS"
      value={dps !== null ? `${formatInt(dps)} DPS` : null}
      subtitle="Average over encounter"
      variant="success"
    />
  );
}
