"use client";

import { useCallback } from "react";
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
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useUserSettings } from "@/hooks/use-user-settings";
import { settingsCardOrderAtom } from "@/atoms/user/settings-ui";
import { useSetAtom } from "jotai";
import { RESET } from "jotai/utils";

const MIN_DURATION = 30;
const MAX_DURATION = 600;
const DEFAULT_DURATION = 300;

const MIN_ITERATIONS = 100;
const MAX_ITERATIONS = 10000;
const DEFAULT_ITERATIONS = 1000;

export function SimulationSettingsCard() {
  const { settings, isLoading, isUpdating, updateSettings } = useUserSettings();
  const resetSettingsCardOrder = useSetAtom(settingsCardOrderAtom);

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
          Configure default simulation parameters
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="fight-duration">
              Default Fight Duration
            </FieldLabel>
            <div className="space-y-4">
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
                <div className="w-16 text-center font-medium">
                  {fightDuration}s
                </div>
              </div>
              <FieldDescription>
                Default fight duration in seconds (30-600)
              </FieldDescription>
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="iterations">Default Iterations</FieldLabel>
            <div className="space-y-4">
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
                <div className="w-16 text-center font-medium">{iterations}</div>
              </div>
              <FieldDescription>
                Number of simulation iterations for accuracy (100-10000)
              </FieldDescription>
            </div>
          </Field>

          <Field>
            <FieldLabel>Game Version</FieldLabel>
            <Select defaultValue="live" disabled>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="ptr">PTR</SelectItem>
              </SelectContent>
            </Select>
            <FieldDescription>
              Select the WoW version for simulation data
            </FieldDescription>
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
          Configure default simulation parameters
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="fight-duration">
              Default Fight Duration
            </FieldLabel>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-2 flex-1" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="iterations">Default Iterations</FieldLabel>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-2 flex-1" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </Field>

          <Field>
            <FieldLabel>Game Version</FieldLabel>
            <Skeleton className="h-10 w-48" />
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
