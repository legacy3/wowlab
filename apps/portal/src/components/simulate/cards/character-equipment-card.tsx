"use client";

import { useAtomValue } from "jotai";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { abilityDataAtom } from "@/atoms/charts/state";
import { formatCompact, formatInt, formatPercent } from "@/lib/format";

function formatDamage(value: number): string {
  return formatCompact(value);
}

export function CharacterEquipmentCard() {
  const abilityData = useAtomValue(abilityDataAtom);

  if (abilityData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium">
            Ability Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/10 py-8 px-6 text-center text-sm text-muted-foreground">
            Run a simulation to see ability breakdown
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals for percentages
  const totalDamage = abilityData.reduce((sum, a) => sum + a.damage, 0);
  const totalCasts = abilityData.reduce((sum, a) => sum + a.casts, 0);

  // Sort by damage descending
  const sortedAbilities = [...abilityData].sort((a, b) => b.damage - a.damage);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Ability Breakdown</CardTitle>
        <p className="text-xs text-muted-foreground pt-0.5">
          {formatInt(totalCasts)} total casts · {formatDamage(totalDamage)}{" "}
          total damage
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-5">
          {sortedAbilities.slice(0, 8).map((ability, idx) => {
            const damagePercent =
              totalDamage > 0 ? (ability.damage / totalDamage) * 100 : 0;

            return (
              <div key={ability.ability} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: `hsl(var(--chart-${(idx % 5) + 1}))`,
                      }}
                    />
                    <span className="font-medium">{ability.ability}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      ({formatInt(ability.casts)} casts)
                    </span>
                  </div>
                  <div className="text-right tabular-nums">
                    <span className="font-medium">
                      {formatDamage(ability.damage)}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {formatPercent(damagePercent, 1)}
                    </span>
                  </div>
                </div>
                <Progress value={damagePercent} className="h-1.5" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
