"use client";

import { Link } from "@/components/ui/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatInt } from "@/lib/format";
import type { SimulationResult } from "@/lib/simulation/types";

interface SimulationResultCardProps {
  result: SimulationResult;
  resultId: string | null;
}

export function SimulationResultCard({
  result,
  resultId,
}: SimulationResultCardProps) {
  return (
    <Card className="border-green-500/25 bg-green-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Simulation Complete
          </p>
          {resultId && (
            <Link
              href={`/simulate/results/${resultId}`}
              className="text-xs font-medium text-primary hover:underline"
            >
              View full results →
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-2 pb-4">
        <p className="text-2xl font-semibold tabular-nums">
          {formatInt(Math.round(result.dps))} DPS
        </p>
        <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Total Damage</p>
            <p className="font-medium tabular-nums">
              {formatInt(result.totalDamage)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Casts</p>
            <p className="font-medium tabular-nums">
              {formatInt(result.casts)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Events</p>
            <p className="font-medium tabular-nums">
              {formatInt(result.events.length)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
