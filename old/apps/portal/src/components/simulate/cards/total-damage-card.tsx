"use client";

import { useAtomValue } from "jotai";

import { simTotalDamageAtom } from "@/atoms/simulation/results";
import { formatCompact } from "@/lib/format";
import { StatCard } from "./stat-card";

export function TotalDamageCard() {
  const totalDamage = useAtomValue(simTotalDamageAtom);

  return (
    <StatCard
      label="Total Damage"
      value={totalDamage !== null ? formatCompact(totalDamage) : null}
      subtitle="Cumulative damage dealt"
    />
  );
}
