"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Crosshair, Gauge, Shield, Zap } from "lucide-react";
import { formatDurationMs } from "@/lib/format";
import { useSpellData } from "../spell-context";

export function QuickStatsCard() {
  const spell = useSpellData();

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Quick Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Cast Time</p>
              <p className="font-medium">{formatDurationMs(spell.castTime)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Cooldown</p>
              <p className="font-medium">{formatDurationMs(spell.cooldown)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Range</p>
              <p className="font-medium">{spell.range.max} yds</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Resource</p>
              <p className="font-medium">
                {spell.cost.amount} {spell.cost.type}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">GCD</p>
              <p className="font-medium">{formatDurationMs(spell.gcd)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">School</p>
              <p className="font-medium">{spell.school}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
