"use client";

// TODO(refine-migration): Replace with Refine data hooks in Phase 4/5
// import { useAtom } from "jotai";
// import { itemCombosAtom } from "@/atoms/sim/results";
import { formatInt, formatPercent } from "@/lib/format";

export function ResultsCombos() {
  // TODO(refine-migration): Replace with Refine useList hook
  // const [itemCombos] = useAtom(itemCombosAtom);
  const itemCombos: {
    rank: number;
    dps: number;
    gain: number;
    gainPercent: number;
    items: string[];
  }[] = [];

  if (itemCombos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/20 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
        Run a simulation to generate optimized item combinations.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {itemCombos.map((combo) => (
        <div
          key={combo.rank}
          className="rounded-lg border bg-card p-3 space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {formatInt(combo.rank)}
              </div>
              <span className="text-lg font-semibold">
                {formatInt(combo.dps)} DPS
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-green-500">
                +{formatInt(combo.gain)} DPS
              </div>
              <div className="text-xs text-muted-foreground">
                +{formatPercent(combo.gainPercent, 1)}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {combo.items.map((item, i) => (
              <span key={i} className="text-xs bg-muted px-2 py-1 rounded">
                {item}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
