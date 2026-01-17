"use client";

import { Activity } from "lucide-react";
import { useExtracted } from "next-intl";

import { StatCard } from "@/components/ui";
import { useWorkerSystem } from "@/lib/state";

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
