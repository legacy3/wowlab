"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const UPGRADE_STEPS = [
  {
    priority: 1,
    slot: "Trinket",
    item: "Icon of the Silver Crescent",
    gain: "+127 DPS",
    source: "Badge Vendor",
  },
  {
    priority: 2,
    slot: "Weapon",
    item: "Blade of Wizardry",
    gain: "+94 DPS",
    source: "Prince Malchezaar",
  },
  {
    priority: 3,
    slot: "Head",
    item: "Cowl of the Grand Engineer",
    gain: "+68 DPS",
    source: "Tempest Keep",
  },
] as const;

export function TopGearUpgradePathCard() {
  return (
    <Card className="h-full" data-tour="upgrade-path">
      <CardHeader>
        <CardTitle>Upgrade Path</CardTitle>
        <CardDescription>Recommended gear acquisition order</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {UPGRADE_STEPS.map((upgrade) => (
          <div
            key={upgrade.priority}
            className="flex items-center gap-4 rounded-lg border p-4"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
              {upgrade.priority}
            </div>
            <div className="flex-1">
              <p className="font-medium">{upgrade.item}</p>
              <p className="text-sm text-muted-foreground">
                {upgrade.slot} • {upgrade.source}
              </p>
            </div>
            <Badge>{upgrade.gain}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
