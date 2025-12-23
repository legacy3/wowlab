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
      <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/10 py-10 px-6 text-center text-sm text-muted-foreground">
        Run a simulation to generate optimized item combinations.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {itemCombos.map((combo) => (
        <div
          key={combo.rank}
          className="rounded-lg border bg-card p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold tabular-nums">
                {formatInt(combo.rank)}
              </div>
              <span className="text-lg font-semibold tabular-nums">
                {formatInt(combo.dps)} DPS
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-green-500 tabular-nums">
                +{formatInt(combo.gain)} DPS
              </div>
              <div className="text-xs text-muted-foreground tabular-nums">
                +{formatPercent(combo.gainPercent, 1)}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {combo.items.map((item, i) => (
              <span
                key={i}
                className="text-xs bg-muted/80 px-2.5 py-1 rounded-md"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
