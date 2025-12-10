"use client";

import { useMemo } from "react";
import { Wand2, Users, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GAME_CONFIG } from "@/lib/config/game";
import {
  SPEC_COVERAGE_DATA,
  CLASS_ORDER,
  CLASS_COLORS,
  calculateCoverage,
  getOverallStats,
  type WowClassName,
} from "@/lib/mock/spec-coverage";
import { getCoverageTextColor } from "@/lib/utils/coverage";

export function OverviewCard() {
  const stats = useMemo(() => getOverallStats(), []);

  const classStats = useMemo(() => {
    return CLASS_ORDER.map((className) => {
      const specs = SPEC_COVERAGE_DATA.filter((s) => s.className === className);
      const allSpells = specs.flatMap((s) => s.spells);
      return {
        className,
        coverage: calculateCoverage(allSpells),
        color: CLASS_COLORS[className as WowClassName],
      };
    }).sort((a, b) => b.coverage - a.coverage);
  }, []);

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" />
            Coverage Overview
          </CardTitle>
          <Badge variant="outline" className="font-mono text-xs">
            {GAME_CONFIG.patchVersion}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {GAME_CONFIG.expansionName} - {GAME_CONFIG.seasonName}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Row */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="text-2xl font-bold tabular-nums leading-none">
                {stats.totalSpecs}
              </div>
              <div className="text-xs text-muted-foreground">Specs</div>
            </div>
          </div>

          <Separator orientation="vertical" className="h-10" />

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Wand2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="text-2xl font-bold tabular-nums leading-none">
                {stats.totalSpells}
              </div>
              <div className="text-xs text-muted-foreground">Spells</div>
            </div>
          </div>

          <Separator orientation="vertical" className="h-10" />

          <div>
            <div
              className={`text-2xl font-bold tabular-nums leading-none ${getCoverageTextColor(stats.coverage)}`}
            >
              {stats.coverage}%
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.supportedSpells}/{stats.totalSpells} covered
            </div>
          </div>
        </div>

        <Separator />

        {/* Class Leaderboard */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            By Class
          </div>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {classStats.map((stat, i) => (
              <div
                key={stat.className}
                className="relative flex items-center justify-between rounded px-2 py-1 text-sm overflow-hidden"
              >
                {/* Background bar */}
                <div
                  className="absolute inset-y-0 left-0 rounded opacity-20"
                  style={{
                    width: `${stat.coverage}%`,
                    backgroundColor: stat.color,
                  }}
                />
                {/* Content */}
                <div className="relative flex items-center gap-1.5">
                  <span className="w-4 text-xs text-muted-foreground/60 tabular-nums">
                    {i + 1}.
                  </span>
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: stat.color }}
                  />
                  <span className="text-muted-foreground">{stat.className}</span>
                </div>
                <span
                  className={`relative tabular-nums font-semibold ${getCoverageTextColor(stat.coverage)}`}
                >
                  {stat.coverage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
