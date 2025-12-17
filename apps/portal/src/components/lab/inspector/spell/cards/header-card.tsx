"use client";

import { GameIcon } from "@/components/game/game-icon";
import { SCHOOL_COLORS } from "@/components/game/game-tooltip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { useSpellData } from "../spell-context";

export function HeaderCard() {
  const spell = useSpellData();

  const schoolKey = spell.school.toLowerCase() as keyof typeof SCHOOL_COLORS;
  const schoolColor = SCHOOL_COLORS[schoolKey] ?? "#ffffff";

  return (
    <Card className="h-full">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div
            className="shrink-0 overflow-hidden rounded-lg border-2"
            style={{ borderColor: schoolColor }}
          >
            <GameIcon iconName={spell.iconName} size="large" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold">{spell.name}</h1>
              <div className="flex items-center gap-1">
                <Badge variant="outline">Spell #{spell.id}</Badge>
                <CopyButton value={spell.id.toString()} />
              </div>
              {spell.isPassive && <Badge variant="secondary">Passive</Badge>}
              <Badge
                variant="outline"
                style={{ borderColor: schoolColor, color: schoolColor }}
              >
                {spell.school}
              </Badge>
            </div>
            <p className="mt-2 text-muted-foreground">{spell.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
