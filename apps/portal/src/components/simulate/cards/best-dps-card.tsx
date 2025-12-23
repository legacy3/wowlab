"use client";

import { useAtomValue } from "jotai";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { simDpsAtom } from "@/atoms/simulation/results";
import { formatInt } from "@/lib/format";

export function BestDpsCard() {
  const dps = useAtomValue(simDpsAtom);

  if (dps === null) {
    return (
      <Card className="border-muted-foreground/25 bg-muted/5">
        <CardHeader className="space-y-1.5 pb-4">
          <CardDescription className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Simulated DPS
          </CardDescription>
          <CardTitle className="text-2xl tabular-nums text-muted-foreground">
            --
          </CardTitle>
          <p className="text-xs text-muted-foreground pt-1">Run a simulation</p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-green-500/25 bg-green-500/5">
      <CardHeader className="space-y-1.5 pb-4">
        <CardDescription className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Simulated DPS
        </CardDescription>
        <CardTitle className="text-2xl tabular-nums">
          {formatInt(dps)} DPS
        </CardTitle>
        <p className="text-xs text-muted-foreground pt-1">
          Average over encounter
        </p>
      </CardHeader>
    </Card>
  );
}
