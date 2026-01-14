"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useSpellData } from "../spell-context";

export function RelatedSpellsCard() {
  const spell = useSpellData();
  const { relatedSpells } = spell;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Related Spells</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-medium">Replaces:</p>
            <p className="text-muted-foreground">
              {relatedSpells.replaces ? (
                <Link
                  href={`/lab/inspector/spell/${relatedSpells.replaces.id}`}
                  className="text-primary hover:underline"
                >
                  #{relatedSpells.replaces.id} {relatedSpells.replaces.name}
                </Link>
              ) : (
                "-"
              )}
            </p>
          </div>
          <div>
            <p className="font-medium">Replaced By:</p>
            <p className="text-muted-foreground">
              {relatedSpells.replacedBy ? (
                <Link
                  href={`/lab/inspector/spell/${relatedSpells.replacedBy.id}`}
                  className="text-primary hover:underline"
                >
                  #{relatedSpells.replacedBy.id} {relatedSpells.replacedBy.name}
                </Link>
              ) : (
                "-"
              )}
            </p>
          </div>
        </div>

        <div>
          <p className="font-medium">Triggered By This Spell:</p>
          {relatedSpells.triggeredByThis.length > 0 ? (
            <ul className="mt-1 space-y-1">
              {relatedSpells.triggeredByThis.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/lab/inspector/spell/${s.id}`}
                    className="text-primary hover:underline"
                  >
                    #{s.id} {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">(none)</p>
          )}
        </div>

        <div>
          <p className="font-medium">Triggers This Spell:</p>
          {relatedSpells.triggersThis.length > 0 ? (
            <ul className="mt-1 space-y-1">
              {relatedSpells.triggersThis.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/lab/inspector/spell/${s.id}`}
                    className="text-primary hover:underline"
                  >
                    #{s.id} {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">
              #{spell.id} is directly cast (not triggered)
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
