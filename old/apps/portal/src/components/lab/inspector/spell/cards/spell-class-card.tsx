"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { formatHex } from "@/lib/hex";
import { useSpellData } from "../spell-context";

export function SpellClassCard() {
  const spell = useSpellData();

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Spell Class Options
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Spell Class Set</p>
            <p className="font-medium">
              {spell.spellClassSet} ({spell.spellClassSetName})
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Spell Class Mask</p>
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              [{spell.spellClassMask.map(formatHex).join(", ")}]
            </code>
          </div>
        </div>

        {spell.modifiedBy.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This mask is used by talents and other spells to modify this
              ability:
            </p>
            <ul className="space-y-1 text-sm">
              {spell.modifiedBy.map((mod) => (
                <li key={mod.id}>
                  <Link
                    href={`/lab/inspector/spell/${mod.id}`}
                    className="text-primary hover:underline"
                  >
                    {mod.name} (#{mod.id})
                  </Link>
                  <span className="text-muted-foreground">
                    {" "}
                    - {mod.description}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
