"use client";

import { useAtomValue } from "jotai";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { abilityDataAtom } from "@/atoms/charts/state";

const intl = {
  number: new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }),
};

function formatDamage(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  
  return intl.number.format(value);
}

export function CharacterEquipmentCard() {
  const abilityData = useAtomValue(abilityDataAtom);

  if (abilityData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Ability Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-muted-foreground/20 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
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
      <CardHeader>
        <CardTitle className="text-sm">Ability Breakdown</CardTitle>
        <p className="text-xs text-muted-foreground">
          {intl.number.format(totalCasts)} total casts |{" "}
          {formatDamage(totalDamage)} total damage
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedAbilities.slice(0, 8).map((ability, idx) => {
            const damagePercent =
              totalDamage > 0 ? (ability.damage / totalDamage) * 100 : 0;

            return (
              <div key={ability.ability} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: `hsl(var(--chart-${(idx % 5) + 1}))`,
                      }}
                    />
                    <span className="font-medium">{ability.ability}</span>
                    <span className="text-xs text-muted-foreground">
                      ({ability.casts} casts)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">
                      {formatDamage(ability.damage)}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {damagePercent.toFixed(1)}%
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
