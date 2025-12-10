"use client";

import { useMemo, useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getCoverageColor, getCoverageTextColor } from "@/lib/utils/coverage";
import {
  useSpecCoverage,
  type SpecCoverageClass,
  type SpecCoverageSpell,
} from "@/hooks/use-spec-coverage";
import { calculateCoverage, getCounts } from "@/lib/spec-coverage";
import { WowSpellLink } from "@/components/game";

interface SelectedSpec {
  className: string;
  classColor: string;
  specName: string;
  spells: SpecCoverageSpell[];
}

interface SpecCellProps {
  spec: {
    id: number;
    name: string;
    spells: SpecCoverageSpell[];
  };
  className: string;
  classColor: string;
  onSelect: (spec: SelectedSpec) => void;
}

function SpecCell({ spec, className, classColor, onSelect }: SpecCellProps) {
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
                className,
                classColor,
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

interface ClassRowProps {
  cls: SpecCoverageClass;
  maxSpecs: number;
  onSelectSpec: (spec: SelectedSpec) => void;
}

function ClassRow({ cls, maxSpecs, onSelectSpec }: ClassRowProps) {
  const allSpells = cls.specs.flatMap((s) => s.spells);
  const classCoverage = calculateCoverage(allSpells);

  return (
    <div className="flex items-center gap-1.5">
      {/* Class name column */}
      <div className="flex w-28 shrink-0 items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: cls.color }}
        />
        <span className="truncate text-xs font-medium">{cls.name}</span>
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
        {cls.specs.map((spec) => (
          <div key={spec.id} className="flex-1 min-w-[40px] p-0.5">
            <SpecCell
              spec={spec}
              className={cls.name}
              classColor={cls.color}
              onSelect={onSelectSpec}
            />
          </div>
        ))}
        {/* Empty cells for alignment */}
        {Array.from({ length: maxSpecs - cls.specs.length }).map((_, i) => (
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

function SpellListDialog({
  spec,
  open,
  onOpenChange,
}: {
  spec: SelectedSpec | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!spec) {
    return null;
  }

  const supported = spec.spells.filter((s) => s.supported);
  const missing = spec.spells.filter((s) => !s.supported);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: spec.classColor }}
            />
            {spec.specName} {spec.className}
          </DialogTitle>
          <DialogDescription>
            {supported.length} of {spec.spells.length} spells supported (
            {Math.round((supported.length / spec.spells.length) * 100)}%)
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pr-4">
            {supported.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-emerald-500 flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Supported ({supported.length})
                </h4>
                <ul className="space-y-1">
                  {supported.map((spell) => (
                    <li
                      key={spell.id}
                      className="text-sm flex items-center gap-2"
                    >
                      <WowSpellLink spellId={spell.id} />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {missing.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-rose-500 flex items-center gap-1.5 mb-2">
                  <XCircle className="h-4 w-4" />
                  Missing ({missing.length})
                </h4>
                <ul className="space-y-1">
                  {missing.map((spell) => (
                    <li
                      key={spell.id}
                      className="text-sm flex items-center gap-2 text-muted-foreground"
                    >
                      <WowSpellLink spellId={spell.id} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function CoverageMatrix() {
  const { data, loading, error } = useSpecCoverage();
  const [selectedSpec, setSelectedSpec] = useState<SelectedSpec | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const maxSpecs = useMemo(() => {
    if (!data) {
      return 0;
    }
    return Math.max(...data.classes.map((cls) => cls.specs.length));
  }, [data]);

  const handleSelectSpec = (spec: SelectedSpec) => {
    setSelectedSpec(spec);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading coverage matrix...
        </span>
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">Error: {error}</p>;
  }

  if (!data) {
    return null;
  }

  return (
    <>
      <div className="space-y-3">
        {/* Legend */}
        <div className="flex justify-end">
          <Legend />
        </div>

        {/* Rows */}
        <div className="space-y-1">
          {data.classes.map((cls) => (
            <ClassRow
              key={cls.id}
              cls={cls}
              maxSpecs={maxSpecs}
              onSelectSpec={handleSelectSpec}
            />
          ))}
        </div>
      </div>

      <SpellListDialog
        spec={selectedSpec}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
