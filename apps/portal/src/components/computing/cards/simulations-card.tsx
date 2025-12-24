"use client";

import { useAtomValue } from "jotai";
import { Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { workerSystemAtom } from "@/atoms/computing";

export function SimulationsCard() {
  const system = useAtomValue(workerSystemAtom);

  return (
    <Card className="h-full p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <Activity className="h-3.5 w-3.5" />
        Simulations
      </div>
      <p className="text-2xl font-bold mt-1 tabular-nums">
        {system.totalSimulationsRun}
      </p>
    </Card>
  );
}
