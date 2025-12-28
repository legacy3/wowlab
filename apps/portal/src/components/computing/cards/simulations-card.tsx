"use client";

import { useAtomValue } from "jotai";
import { Activity } from "lucide-react";
import { workerSystemAtom } from "@/atoms/computing";
import { formatInt } from "@/lib/format";
import { StatCard } from "./stat-card";

export function SimulationsCard() {
  const system = useAtomValue(workerSystemAtom);

  return (
    <StatCard
      icon={Activity}
      label="Simulations"
      value={formatInt(system.totalSimulationsRun)}
    />
  );
}
