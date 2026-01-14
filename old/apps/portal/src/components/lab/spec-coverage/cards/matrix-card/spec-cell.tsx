import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getCoverageColor } from "@/lib/utils/coverage";
import { calculateCoverage, getCounts } from "@/lib/spec-coverage";

import type { SelectedSpec } from "./types";
import type { SpecCoverageSpell } from "@/hooks/use-spec-coverage";

interface SpecCellProps {
  spec: {
    id: number;
    name: string;
    spells: SpecCoverageSpell[];
  };
  classId: number;
  className: string;
  classColor: string;
  onSelect: (spec: SelectedSpec) => void;
}

export function SpecCell({
  spec,
  classId,
  className,
  classColor,
  onSelect,
}: SpecCellProps) {
  const coverage = calculateCoverage(spec.spells);
  const counts = getCounts(spec.spells);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() =>
              onSelect({
                classId,
                className,
                classColor,
                specId: spec.id,
                specName: spec.name,
                spells: spec.spells,
              })
            }
            className={cn(
              "flex h-8 w-full cursor-pointer items-center justify-center rounded-sm transition-all hover:scale-105 hover:brightness-110",
              getCoverageColor(coverage),
              "text-white font-medium text-xs",
            )}
          >
            <span className="hidden sm:inline">{coverage}%</span>
          </button>
        </TooltipTrigger>

        <TooltipContent side="top" className="p-3">
          <div className="space-y-2">
            <div className="font-semibold">
              {spec.name} {className}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <span className="opacity-70">Coverage</span>
              <span className="font-semibold text-right">{coverage}%</span>
              <span className="opacity-70">Supported</span>
              <span className="font-medium text-right">{counts.supported}</span>
              <span className="opacity-70">Missing</span>
              <span className="font-medium text-right">
                {counts.total - counts.supported}
              </span>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Click to view spells
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
