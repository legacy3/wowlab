"use client";

import { Activity } from "lucide-react";

import { useWorkerSystem } from "@/lib/state";
import { formatInt } from "@/lib/utils";

import { StatCard } from "./stat-card";

export function SimulationsCard() {
  const totalSimulations = useWorkerSystem((s) => s.totalSimulationsRun);

  return (
    <StatCard
      icon={Activity}
      label="Simulations"
      value={formatInt(totalSimulations)}
    />
  );
}
