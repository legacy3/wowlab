"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSpellData } from "../spell-context";

export function EffectsCard() {
  const spell = useSpellData();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Spell Effects</CardTitle>
        <CardDescription>
          Detailed breakdown of each spell effect
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {spell.effects.map((effect) => (
          <div
            key={effect.index}
            className="space-y-2 rounded-lg border bg-muted/30 p-4"
          >
            <div className="flex items-center gap-2">
              <Badge variant="outline">Effect #{effect.index}</Badge>
              <span className="font-semibold">
                {effect.effectType} ({effect.effectTypeId})
              </span>
              {effect.auraType && (
                <>
                  <span className="text-muted-foreground">-</span>
                  <span className="text-muted-foreground">
                    {effect.auraType} ({effect.auraTypeId})
                  </span>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Points:</span>
                <span>{effect.basePoints}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coefficient (SP):</span>
                <span>{effect.coefficient}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coefficient (AP):</span>
                <span>{effect.apCoefficient}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Variance:</span>
                <span>{effect.variance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">PvP Multiplier:</span>
                <span>{effect.pvpMultiplier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chain Targets:</span>
                <span>{effect.chainTargets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Radius:</span>
                <span>
                  {effect.radiusMin} - {effect.radiusMax} yds
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target:</span>
                <span className="truncate text-right">
                  {effect.target} ({effect.targetId})
                </span>
              </div>
              {effect.auraPeriod && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aura Period:</span>
                  <span>{effect.auraPeriod}ms</span>
                </div>
              )}
              {effect.duration && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span>{effect.duration}ms</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
