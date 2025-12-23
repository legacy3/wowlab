"use client";

import { useAtomValue } from "jotai";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { simTotalDamageAtom } from "@/atoms/simulation/results";
import { formatCompact } from "@/lib/format";

function formatDamage(value: number): string {
  return formatCompact(value);
}

export function BaselineDpsCard() {
  const totalDamage = useAtomValue(simTotalDamageAtom);

  if (totalDamage === null) {
    return (
      <Card className="border-muted-foreground/25 bg-muted/5">
        <CardHeader className="space-y-1">
          <CardDescription className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total Damage
          </CardDescription>
          <CardTitle className="text-xl text-muted-foreground">--</CardTitle>
          <p className="text-xs text-muted-foreground">Run a simulation</p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardDescription className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Total Damage
        </CardDescription>
        <CardTitle className="text-xl">{formatDamage(totalDamage)}</CardTitle>
        <p className="text-xs text-muted-foreground">Cumulative damage dealt</p>
      </CardHeader>
    </Card>
  );
}
