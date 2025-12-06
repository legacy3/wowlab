"use client";

import { useCallback, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUserSettings } from "@/hooks/use-user-settings";
import { settingsCardOrderAtom } from "@/atoms/user/settings-ui";
import { useSetAtom } from "jotai";
import { RESET } from "jotai/utils";
import { getSupabaseClient } from "@/lib/refine/data-provider";

const MIN_PARALLEL = 1;
const MAX_PARALLEL = 200;
const DEFAULT_MAX_PARALLEL = 50;

export function SimulationSettingsCard() {
  const { settings, isLoading, isUpdating, updateSettings } = useUserSettings();
  const resetSettingsCardOrder = useSetAtom(settingsCardOrderAtom);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const seed = settings?.simulationSeed ?? "";
  const maxParallel = settings?.maxParallelSimulations ?? DEFAULT_MAX_PARALLEL;

  const handleRegenerateSeed = useCallback(async () => {
    setIsRegenerating(true);
    try {
      const { data, error } = await getSupabaseClient().rpc(
        "generate_random_seed",
      );

      if (error) {
        throw error;
      }
      
      updateSettings({ simulationSeed: data });
      toast.success("Simulation seed regenerated");
    } catch {
      toast.error("Failed to regenerate seed");
    } finally {
      setIsRegenerating(false);
    }
  }, [updateSettings]);

  const handleMaxParallelChange = useCallback(
    (value: number[]) => {
      updateSettings({ maxParallelSimulations: value[0] });
    },
    [updateSettings],
  );

  const handleResetInterface = useCallback(() => {
    resetSettingsCardOrder(RESET);
    toast.success("Interface configuration reset to defaults");
  }, [resetSettingsCardOrder]);

  if (isLoading) {
    return <SimulationSettingsCardSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulation Settings</CardTitle>
        <CardDescription>
          Configure simulation parameters and interface preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="seed">Simulation Seed</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="seed"
                value={seed}
                disabled
                className="font-mono opacity-60"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleRegenerateSeed}
                disabled={isRegenerating || isUpdating}
                title="Regenerate seed"
              >
                {isRegenerating || isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
            <FieldDescription>
              Random seed used for simulation calculations
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="max-parallel">
              Maximum Parallel Simulations
            </FieldLabel>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Slider
                  id="max-parallel"
                  min={MIN_PARALLEL}
                  max={MAX_PARALLEL}
                  step={1}
                  value={[maxParallel]}
                  onValueCommit={handleMaxParallelChange}
                  disabled={isUpdating}
                  className="flex-1"
                />
                <div className="w-12 text-center font-medium">{maxParallel}</div>
              </div>
              <FieldDescription>
                Number of simulations that can run concurrently (1-200)
              </FieldDescription>
            </div>
          </Field>

          <Field>
            <FieldLabel>Interface Configuration</FieldLabel>
            <Button
              variant="outline"
              onClick={handleResetInterface}
              className="w-full sm:w-auto"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Drag & Drop Settings
            </Button>
            <FieldDescription>
              Reset all customized panel positions and layouts to defaults
            </FieldDescription>
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
        <CardTitle>Simulation Settings</CardTitle>
        <CardDescription>
          Configure simulation parameters and interface preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="seed">Simulation Seed</FieldLabel>
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-10" />
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="max-parallel">
              Maximum Parallel Simulations
            </FieldLabel>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-2 flex-1" />
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
          </Field>

          <Field>
            <FieldLabel>Interface Configuration</FieldLabel>
            <Skeleton className="h-10 w-48" />
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
