"use client";

import { useState } from "react";
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
import { RefreshCw, RotateCcw } from "lucide-react";
import { toast } from "sonner";

// Mock initial values - these will be replaced with real state management
const MOCK_SEED = "a1b2c3d4e5f6";
const MOCK_MAX_PARALLEL = 50;
const MIN_PARALLEL = 1;
const MAX_PARALLEL = 200;

export function SimulationSettingsCard() {
  const [seed, setSeed] = useState(MOCK_SEED);
  const [maxParallel, setMaxParallel] = useState([MOCK_MAX_PARALLEL]);

  const handleRegenerateSeed = () => {
    // Mock seed generation - will be replaced with actual implementation
    const newSeed = Array.from({ length: 12 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join("");
    setSeed(newSeed);
    toast.success("Simulation seed regenerated");
  };

  const handleResetInterface = () => {
    // Mock interface reset - will be replaced with actual implementation
    toast.success("Interface configuration reset to defaults");
  };

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
                title="Regenerate seed"
              >
                <RefreshCw className="h-4 w-4" />
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
                  value={maxParallel}
                  onValueChange={setMaxParallel}
                  className="flex-1"
                />
                <div className="w-12 text-center font-medium">
                  {maxParallel[0]}
                </div>
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
