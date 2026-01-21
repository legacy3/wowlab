"use client";

import { Activity } from "lucide-react";
import { useIntlayer } from "next-intlayer";

import { StatCard } from "@/components/ui";
import { useWorkerSystem } from "@/lib/state";

export function SimulationsCard() {
  const content = useIntlayer("computing").simulationsCard;
  const totalSimulations = useWorkerSystem((s) => s.totalSimulationsRun);

  return (
    <StatCard
      icon={Activity}
      label={content.simulations}
      value={totalSimulations.toLocaleString()}
    />
  );
}
