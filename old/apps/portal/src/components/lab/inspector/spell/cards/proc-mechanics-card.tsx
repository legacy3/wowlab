"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Zap } from "lucide-react";
import Link from "next/link";
import { useSpellData } from "../spell-context";

export function ProcMechanicsCard() {
  const spell = useSpellData();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Proc Mechanics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {spell.procData ? (
          <div>Proc data here</div>
        ) : (
          <Empty className="border-0 py-4">
            <EmptyMedia variant="icon">
              <Zap className="h-5 w-5" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle className="text-base">No Proc Behavior</EmptyTitle>
              <EmptyDescription>
                This is a directly cast spell with no proc mechanics.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {spell.triggersSpells.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Triggers Spells:</h4>
            <ul className="space-y-1">
              {spell.triggersSpells.map((s) => (
                <li key={s.id} className="text-sm">
                  <Link
                    href={`/lab/inspector/spell/${s.id}`}
                    className="text-primary hover:underline"
                  >
                    #{s.id} {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
