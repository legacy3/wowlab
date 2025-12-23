"use client";

import { useAtomValue } from "jotai";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { simDurationAtom } from "@/atoms/simulation/results";

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);

  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }

  return `${secs}s`;
}

export function AvgGainCard() {
  const duration = useAtomValue(simDurationAtom);

  if (duration === null) {
    return (
      <Card className="border-muted-foreground/25 bg-muted/5">
        <CardHeader className="space-y-1.5 pb-4">
          <CardDescription className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Duration
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
    <Card>
      <CardHeader className="space-y-1.5 pb-4">
        <CardDescription className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Duration
        </CardDescription>
        <CardTitle className="text-2xl tabular-nums">
          {formatDuration(duration)}
        </CardTitle>
        <p className="text-xs text-muted-foreground pt-1">Encounter length</p>
      </CardHeader>
    </Card>
  );
}
