"use client";

import { useAtom, useSetAtom } from "jotai";
import { useRouter } from "next/navigation";
import { History, Play, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  recentCharactersParsedAtom,
  recentCharacterSimcAtom,
  type RecentCharacterSummary,
} from "@/atoms/sim/recent-characters";
import { setSimcInputAtom } from "@/atoms/sim";
import { CLASS_COLORS, type WowClass } from "@/atoms/dps-rankings";

function CharacterRow({
  character,
  index,
  onSelect,
}: {
  character: RecentCharacterSummary;
  index: number;
  onSelect: (index: number) => void;
}) {
  const { data } = character;
  const className = data.character.class as WowClass;
  const classColor = CLASS_COLORS[className] ?? "#888";

  return (
    <button
      onClick={() => onSelect(index)}
      className="group flex w-full items-center gap-2 rounded-md border p-2 text-left transition-colors hover:bg-accent"
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${classColor}20` }}
      >
        <User className="h-4 w-4" style={{ color: classColor }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{data.character.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {data.character.spec} {data.character.class}
        </p>
      </div>
      <Play className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

export function RecentCard() {
  const [recentCharacters] = useAtom(recentCharactersParsedAtom);
  const [recentSimc] = useAtom(recentCharacterSimcAtom);
  const setSimcInput = useSetAtom(setSimcInputAtom);
  const router = useRouter();

  const handleSelect = async (index: number) => {
    const simc = recentSimc[index];
    if (simc) {
      await setSimcInput(simc);
      router.push("/simulate");
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 shrink-0 text-muted-foreground" />
          Recent Characters
        </CardTitle>
        <CardDescription>
          {recentCharacters.length > 0
            ? "Click to load and simulate"
            : "Your imported characters appear here"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recentCharacters.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Paste a SimC export to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {recentCharacters.slice(0, 4).map((char, index) => (
              <CharacterRow
                key={index}
                character={char}
                index={index}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
