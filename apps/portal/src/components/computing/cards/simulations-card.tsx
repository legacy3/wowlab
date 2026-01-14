"use client";

import { Activity } from "lucide-react";
import { useExtracted } from "next-intl";

import { useWorkerSystem } from "@/lib/state";

import { StatCard } from "./stat-card";

export function SimulationsCard() {
  const t = useExtracted();
  const totalSimulations = useWorkerSystem((s) => s.totalSimulationsRun);

  return (
    <StatCard
      icon={Activity}
      label={t("Simulations")}
      value={t("{value, number}", { value: totalSimulations })}
    />
  );
}
