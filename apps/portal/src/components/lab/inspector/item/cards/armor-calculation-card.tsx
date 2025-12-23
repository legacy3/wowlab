"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { formatInt, formatPercent } from "@/lib/format";
import { useItemData } from "../item-context";

export function ArmorCalculationCard() {
  const item = useItemData();

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Shield className="h-4 w-4 shrink-0" />
          Armor Calculation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Base Armor</p>
            <p className="font-medium tabular-nums">
              {formatInt(item.armorCalculation.baseArmor)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Armor Type</p>
            <p className="font-medium">{item.armorCalculation.armorType}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Armor Formula</p>
          <code className="block rounded bg-muted px-2.5 py-1.5 text-xs font-mono">
            {item.armorCalculation.formula}
          </code>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            Damage Reduction vs Level 80
          </p>
          <p className="font-medium">
            Physical DR:{" "}
            <span className="tabular-nums">
              {formatPercent(item.armorCalculation.physicalDR, 1)}
            </span>{" "}
            <span className="text-muted-foreground font-normal">
              (with this piece only)
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
