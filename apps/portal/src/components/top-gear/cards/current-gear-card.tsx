"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CURRENT_SLOTS = [
  { name: "Head", current: "Spellstrike Hood", dps: 2847 },
  { name: "Neck", current: "Brooch of Heightened Potential", dps: 2847 },
  { name: "Shoulders", current: "Mantle of the Avatar", dps: 2847 },
  { name: "Back", current: "Sergeant's Heavy Cloak", dps: 2847 },
  { name: "Chest", current: "Robes of the Incarnate", dps: 2847 },
  { name: "Wrists", current: "Bracers of Nimble Thought", dps: 2847 },
] as const;

export function TopGearCurrentGearCard() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Current Gear Set</CardTitle>
        <CardDescription>
          Your equipped items and their performance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {CURRENT_SLOTS.map((slot) => (
          <div
            key={slot.name}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div>
              <p className="font-medium">{slot.name}</p>
              <p className="text-sm text-muted-foreground">{slot.current}</p>
            </div>
            <Badge variant="secondary">{slot.dps} DPS</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
