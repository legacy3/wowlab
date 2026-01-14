import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

export type CharacterProfession = Readonly<{
  name: string;
  rank: number;
}>;

export type CharacterSummary = Readonly<{
  class: string;
  level: number;
  name: string;
  race: string;
  region: string;
  realm: string;
  spec?: string;
}>;

type CharacterSummaryCardProps = {
  character: CharacterSummary;
  professions?: ReadonlyArray<CharacterProfession>;
  rightContent?: ReactNode;
};

export function CharacterSummaryCard({
  character,
  professions = [],
  rightContent,
}: CharacterSummaryCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/10 to-secondary/10 p-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div>
          <h2 className="text-base font-bold">{character.name}</h2>
          <p className="text-xs text-muted-foreground">
            {character.realm} • {character.region}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge className="text-[10px] h-5">Level {character.level}</Badge>
          {character.spec ? (
            <Badge variant="outline" className="text-[10px] h-5">
              {character.spec}
            </Badge>
          ) : null}
          <Badge variant="secondary" className="text-[10px] h-5">
            {character.race} {character.class}
          </Badge>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {professions.map((profession) => (
          <Badge
            key={profession.name}
            variant="outline"
            className="text-[10px] h-5"
          >
            {profession.name} {profession.rank}
          </Badge>
        ))}
        {rightContent}
      </div>
    </div>
  );
}
