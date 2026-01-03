"use client";

import { useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserSettings } from "@/hooks/use-user-settings";
import { formatInt } from "@/lib/format";

const MIN_DURATION = 30;
const MAX_DURATION = 600;
const DEFAULT_DURATION = 300;

const MIN_ITERATIONS = 100;
const MAX_ITERATIONS = 10000;
const DEFAULT_ITERATIONS = 1000;

export function SimulationSettingsCard() {
  const { settings, isLoading, isUpdating, updateSettings } = useUserSettings();

  const fightDuration = settings?.defaultFightDuration ?? DEFAULT_DURATION;
  const iterations = settings?.defaultIterations ?? DEFAULT_ITERATIONS;

  const handleFightDurationChange = useCallback(
    (value: number[]) => {
      updateSettings({ defaultFightDuration: value[0] });
    },
    [updateSettings],
  );

  const handleIterationsChange = useCallback(
    (value: number[]) => {
      updateSettings({ defaultIterations: value[0] });
    },
    [updateSettings],
  );

  if (isLoading) {
    return <SimulationSettingsCardSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulation</CardTitle>
        <CardDescription>Default simulation parameters</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="fight-duration">Fight Duration</FieldLabel>
            <div className="flex items-center gap-4">
              <Slider
                id="fight-duration"
                min={MIN_DURATION}
                max={MAX_DURATION}
                step={30}
                value={[fightDuration]}
                onValueCommit={handleFightDurationChange}
                disabled={isUpdating}
                className="flex-1"
              />
              <div className="w-14 text-right tabular-nums text-sm text-muted-foreground">
                {fightDuration}s
              </div>
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="iterations">Iterations</FieldLabel>
            <div className="flex items-center gap-4">
              <Slider
                id="iterations"
                min={MIN_ITERATIONS}
                max={MAX_ITERATIONS}
                step={100}
                value={[iterations]}
                onValueCommit={handleIterationsChange}
                disabled={isUpdating}
                className="flex-1"
              />
              <div className="w-14 text-right tabular-nums text-sm text-muted-foreground">
                {formatInt(iterations)}
              </div>
            </div>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

function SimulationSettingsCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulation</CardTitle>
        <CardDescription>Default simulation parameters</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel>Fight Duration</FieldLabel>
            <div className="flex items-center gap-4">
              <Skeleton className="h-2 flex-1" />
              <Skeleton className="h-5 w-14" />
            </div>
          </Field>
          <Field>
            <FieldLabel>Iterations</FieldLabel>
            <div className="flex items-center gap-4">
              <Skeleton className="h-2 flex-1" />
              <Skeleton className="h-5 w-14" />
            </div>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
