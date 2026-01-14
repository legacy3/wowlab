import { cn } from "@/lib/utils";
import { getCoverageTextColor } from "@/lib/utils/coverage";
import { calculateCoverage } from "@/lib/spec-coverage";

import type { SpecCoverageClass } from "@/hooks/use-spec-coverage";
import type { SelectedSpec } from "./types";
import { SpecCell } from "./spec-cell";

interface ClassRowProps {
  cls: SpecCoverageClass;
  maxSpecs: number;
  onSelectSpec: (spec: SelectedSpec) => void;
}

export function ClassRow({ cls, maxSpecs, onSelectSpec }: ClassRowProps) {
  const allSpells = cls.specs.flatMap((s) => s.spells);
  const classCoverage = calculateCoverage(allSpells);

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex w-28 shrink-0 items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: cls.color }}
        />
        <span className="truncate text-xs font-medium">{cls.name}</span>
      </div>

      <div
        className={cn(
          "w-10 shrink-0 text-center text-xs font-semibold tabular-nums",
          getCoverageTextColor(classCoverage),
        )}
      >
        {classCoverage}%
      </div>

      <div className="flex flex-1 gap-2">
        {cls.specs.map((spec) => (
          <div key={spec.id} className="flex-1 min-w-10 p-0.5">
            <SpecCell
              spec={spec}
              classId={cls.id}
              className={cls.name}
              classColor={cls.color}
              onSelect={onSelectSpec}
            />
          </div>
        ))}

        {Array.from({ length: maxSpecs - cls.specs.length }).map((_, i) => (
          <div key={`empty-${i}`} className="flex-1 min-w-10 p-0.5" />
        ))}
      </div>
    </div>
  );
}
