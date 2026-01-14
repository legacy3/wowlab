"use client";

import { useAtomValue, useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { recentCharactersParsedAtom, setSimcInputAtom } from "@/atoms/sim";

export function RecentCharacterChips() {
  const recentCharacters = useAtomValue(recentCharactersParsedAtom);
  const setSimcInput = useSetAtom(setSimcInputAtom);

  if (recentCharacters.length === 0) {
    return null;
  }

  return (
    <div
      className="flex items-center gap-2 overflow-x-auto pb-1"
      data-tour="recent-characters"
    >
      {recentCharacters.map((entry, index) => {
        const { simc, data } = entry;
        const { character, professions } = data;
        const tooltipText = [
          character.class,
          character.spec,
          character.realm,
          character.region,
          professions.length > 0
            ? professions.map((p) => `${p.name} ${p.rank}`).join(" • ")
            : null,
        ]
          .filter(Boolean)
          .join(" • ");

        return (
          <Tooltip key={`${character.name}-${character.realm}-chip-${index}`}>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                className="h-7 px-2 text-xs font-medium"
                onClick={() => setSimcInput(simc)}
              >
                {character.name}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6}>
              {tooltipText}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
