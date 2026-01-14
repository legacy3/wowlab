"use client";

import { useState } from "react";
import { useAtom } from "jotai";
import { ChevronDown, Settings2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { fightDurationAtom, iterationsAtom } from "@/atoms/sim";

export function AdvancedSettings() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fightDuration, setFightDuration] = useAtom(fightDurationAtom);
  const [iterations, setIterations] = useAtom(iterationsAtom);

  return (
    <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
      <CollapsibleTrigger asChild>
        <button className="flex w-full items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors py-1">
          <span className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Advanced Settings
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="duration" className="text-sm">
              Fight Duration
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="duration"
                type="number"
                value={fightDuration}
                onChange={(e) => setFightDuration(Number(e.target.value))}
                min={30}
                max={900}
              />
              <span className="text-sm text-muted-foreground shrink-0">
                sec
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="iterations" className="text-sm">
              Iterations
            </Label>
            <Input
              id="iterations"
              type="number"
              value={iterations}
              onChange={(e) => setIterations(Number(e.target.value))}
              min={100}
              max={50000}
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
