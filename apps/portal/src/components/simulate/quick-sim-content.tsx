"use client";

import { Suspense } from "react";
import { useAtom } from "jotai";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  selectedClassAtom,
  selectedSpecAtom,
  itemLevelAtom,
  gearPresetAtom,
  fightDurationAtom,
  iterationsAtom,
  targetTypeAtom,
} from "@/atoms/sim";

function QuickSimContentInner() {
  const [selectedClass, setSelectedClass] = useAtom(selectedClassAtom);
  const [selectedSpec, setSelectedSpec] = useAtom(selectedSpecAtom);
  const [itemLevel, setItemLevel] = useAtom(itemLevelAtom);
  const [gearPreset, setGearPreset] = useAtom(gearPresetAtom);
  const [fightDuration, setFightDuration] = useAtom(fightDurationAtom);
  const [iterations, setIterations] = useAtom(iterationsAtom);
  const [targetType, setTargetType] = useAtom(targetTypeAtom);

  const handleReset = () => {
    setSelectedClass(null);
    setSelectedSpec(null);
    setItemLevel(70);
    setGearPreset(null);
    setFightDuration(300);
    setIterations(1000);
    setTargetType("patchwerk");
  };

  const handleRunSim = () => {
    console.log("Running simulation with config:", {
      selectedClass,
      selectedSpec,
      itemLevel,
      gearPreset,
      fightDuration,
      iterations,
      targetType,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulation Configuration</CardTitle>
        <CardDescription>
          Set up your character parameters and combat settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="class">Class</Label>
            <Select
              value={selectedClass ?? undefined}
              onValueChange={(value) =>
                setSelectedClass(value as typeof selectedClass)
              }
            >
              <SelectTrigger id="class">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priest">Priest</SelectItem>
                <SelectItem value="mage">Mage</SelectItem>
                <SelectItem value="warlock">Warlock</SelectItem>
                <SelectItem value="paladin">Paladin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="spec">Specialization</Label>
            <Select
              value={selectedSpec ?? undefined}
              onValueChange={(value) =>
                setSelectedSpec(value as typeof selectedSpec)
              }
            >
              <SelectTrigger id="spec">
                <SelectValue placeholder="Select spec" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shadow">Shadow</SelectItem>
                <SelectItem value="disc">Discipline</SelectItem>
                <SelectItem value="holy">Holy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ilvl">Item Level</Label>
            <Input
              id="ilvl"
              type="number"
              value={itemLevel}
              onChange={(e) => setItemLevel(Number(e.target.value))}
              placeholder="70"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preset">Gear Preset</Label>
            <Select
              value={gearPreset ?? undefined}
              onValueChange={(value) =>
                setGearPreset(value as typeof gearPreset)
              }
            >
              <SelectTrigger id="preset">
                <SelectValue placeholder="Select preset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bis">Best in Slot</SelectItem>
                <SelectItem value="budget">Budget BiS</SelectItem>
                <SelectItem value="fresh">Fresh 60</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Combat Settings</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="duration">Fight Duration (s)</Label>
              <Input
                id="duration"
                type="number"
                value={fightDuration}
                onChange={(e) => setFightDuration(Number(e.target.value))}
                placeholder="300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="iterations">Iterations</Label>
              <Input
                id="iterations"
                type="number"
                value={iterations}
                onChange={(e) => setIterations(Number(e.target.value))}
                placeholder="1000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target">Target Type</Label>
              <Select
                value={targetType}
                onValueChange={(value) =>
                  setTargetType(value as typeof targetType)
                }
              >
                <SelectTrigger id="target">
                  <SelectValue placeholder="Target" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patchwerk">Patchwerk</SelectItem>
                  <SelectItem value="movement">Heavy Movement</SelectItem>
                  <SelectItem value="aoe">Multi-Target</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={handleReset}>
            Reset
          </Button>
          <Button type="submit" onClick={handleRunSim}>
            Run Simulation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickSimContentSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-96" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-px w-full" />
        <div className="space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

export function QuickSimContent() {
  return (
    <Suspense fallback={<QuickSimContentSkeleton />}>
      <QuickSimContentInner />
    </Suspense>
  );
}
