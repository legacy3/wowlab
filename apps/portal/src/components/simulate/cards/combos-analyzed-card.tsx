"use client";

import { useAtomValue } from "jotai";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { simCastsAtom } from "@/atoms/simulation/results";
import { formatInt } from "@/lib/format";

export function CombosAnalyzedCard() {
  const casts = useAtomValue(simCastsAtom);

  if (casts === null) {
    return (
      <Card className="border-muted-foreground/25 bg-muted/5">
        <CardHeader className="space-y-1">
          <CardDescription className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total Casts
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
          Total Casts
        </CardDescription>
        <CardTitle className="text-xl">{formatInt(casts)}</CardTitle>
        <p className="text-xs text-muted-foreground">Abilities executed</p>
      </CardHeader>
    </Card>
  );
}
