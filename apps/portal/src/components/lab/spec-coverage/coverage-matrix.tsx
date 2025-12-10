"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  SPEC_COVERAGE_DATA,
  CLASS_ORDER,
  CLASS_COLORS,
  calculateCoverage,
  getCounts,
  type WowClassName,
  type SpecCoverage,
} from "@/lib/mock/spec-coverage";
import { getCoverageColor, getCoverageTextColor } from "@/lib/utils/coverage";

interface SpecCellProps {
  spec: SpecCoverage;
}

function SpecCell({ spec }: SpecCellProps) {
  const coverage = calculateCoverage(spec.spells);
  const counts = getCounts(spec.spells);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex h-8 w-full cursor-default items-center justify-center rounded-sm transition-all hover:scale-105 hover:brightness-110",
              getCoverageColor(coverage),
              "text-white font-medium text-xs",
            )}
          >
            <span className="hidden sm:inline">{coverage}%</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="p-3">
          <div className="space-y-2">
            <div className="font-semibold">
              {spec.specName} {spec.className}
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
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface ClassRowProps {
  className: WowClassName;
  specs: SpecCoverage[];
  maxSpecs: number;
}

function ClassRow({ className, specs, maxSpecs }: ClassRowProps) {
  const classColor = CLASS_COLORS[className];
  const allSpells = specs.flatMap((s) => s.spells);
  const classCoverage = calculateCoverage(allSpells);

  return (
    <div className="flex items-center gap-1.5">
      {/* Class name column */}
      <div className="flex w-28 shrink-0 items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: classColor }}
        />
        <span className="truncate text-xs font-medium">{className}</span>
      </div>

      {/* Class total */}
      <div
        className={cn(
          "w-10 shrink-0 text-center text-xs font-semibold tabular-nums",
          getCoverageTextColor(classCoverage),
        )}
      >
        {classCoverage}%
      </div>

      {/* Spec cells */}
      <div className="flex flex-1 gap-2">
        {specs.map((spec) => (
          <div key={spec.specName} className="flex-1 min-w-[40px] p-0.5">
            <SpecCell spec={spec} />
          </div>
        ))}
        {/* Empty cells for alignment */}
        {Array.from({ length: maxSpecs - specs.length }).map((_, i) => (
          <div key={`empty-${i}`} className="flex-1 min-w-[40px] p-0.5" />
        ))}
      </div>
    </div>
  );
}

function Legend() {
  const items = [
    { color: "bg-rose-500", label: "0-30" },
    { color: "bg-amber-500", label: "30-50" },
    { color: "bg-amber-400", label: "50-70" },
    { color: "bg-emerald-400", label: "70-90" },
    { color: "bg-emerald-500", label: "90+" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-wide opacity-70">
      {items.map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1">
          <span className={cn("h-3 w-3 rounded-sm", color)} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

export function CoverageMatrix() {
  const groupedByClass = useMemo(() => {
    const groups: Record<WowClassName, SpecCoverage[]> = {} as Record<
      WowClassName,
      SpecCoverage[]
    >;
    for (const spec of SPEC_COVERAGE_DATA) {
      if (!groups[spec.className]) {
        groups[spec.className] = [];
      }
      groups[spec.className].push(spec);
    }
    return groups;
  }, []);

  const maxSpecs = useMemo(() => {
    return Math.max(
      ...Object.values(groupedByClass).map((specs) => specs.length),
    );
  }, [groupedByClass]);

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex justify-end">
        <Legend />
      </div>

      {/* Rows */}
      <div className="space-y-1">
        {CLASS_ORDER.map((className) => (
          <ClassRow
            key={className}
            className={className}
            specs={groupedByClass[className] || []}
            maxSpecs={maxSpecs}
          />
        ))}
      </div>
    </div>
  );
}
