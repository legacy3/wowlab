"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSpellData } from "../spell-context";

export function SimulationNotesCard() {
  const spell = useSpellData();
  const { simulationNotes } = spell;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Simulation Notes</CardTitle>
        <CardDescription>Key values for simulation purposes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Base Damage Coefficient:</p>
            <p className="font-mono">{simulationNotes.baseDamageCoefficient}</p>
          </div>
          <div>
            <p className="text-muted-foreground">DoT Coefficient:</p>
            <p className="font-mono">{simulationNotes.dotCoefficient}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Cast time affected by haste:
            </span>
            <span>
              {simulationNotes.castTimeAffectedByHaste ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              GCD affected by haste:
            </span>
            <span>{simulationNotes.gcdAffectedByHaste ? "Yes" : "No"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Cooldown affected by haste:
            </span>
            <span>
              {simulationNotes.cooldownAffectedByHaste ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Can crit:</span>
            <span>{simulationNotes.canCrit ? "Yes" : "No"}</span>
          </div>
        </div>

        {simulationNotes.notes.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium">Notes:</p>
            <ul className="list-inside list-disc space-y-0.5 text-sm text-muted-foreground">
              {simulationNotes.notes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
