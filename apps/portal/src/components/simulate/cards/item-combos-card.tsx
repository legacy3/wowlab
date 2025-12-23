"use client";

import { useAtomValue } from "jotai";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cooldownDataAtom } from "@/atoms/charts/state";

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);

  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  return `${secs}s`;
}

export function ItemCombosCard() {
  const cooldownData = useAtomValue(cooldownDataAtom);

  if (cooldownData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cooldown Usage</CardTitle>
          <CardDescription>
            Major cooldown timing throughout the fight
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-muted-foreground/20 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            Run a simulation to see cooldown usage
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group by ability
  const cooldownsByAbility = new Map<
    string,
    { times: number[]; duration: number }
  >();

  for (const cd of cooldownData) {
    const existing = cooldownsByAbility.get(cd.ability);
    if (existing) {
      existing.times.push(cd.time);
    } else {
      cooldownsByAbility.set(cd.ability, {
        times: [cd.time],
        duration: cd.duration,
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Cooldown Usage</CardTitle>
        <CardDescription>
          Major cooldown timing throughout the fight
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from(cooldownsByAbility.entries()).map(
            ([ability, { times, duration }]) => (
              <div key={ability} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{ability}</span>
                  <span className="text-xs text-muted-foreground">
                    {times.length}x used ({duration}s duration)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {times.map((time, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20"
                    >
                      {formatTime(time)}
                    </span>
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
      </CardContent>
    </Card>
  );
}
