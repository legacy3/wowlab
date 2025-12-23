"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { formatInt, formatPercent } from "@/lib/format";
import { useItemData } from "../item-context";

export function ArmorCalculationCard() {
  const item = useItemData();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Armor Calculation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-muted-foreground">Base Armor</p>
            <p className="font-medium">
              {formatInt(item.armorCalculation.baseArmor)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Armor Type</p>
            <p className="font-medium">{item.armorCalculation.armorType}</p>
          </div>
        </div>

        <div>
          <p className="text-muted-foreground">Armor Formula:</p>
          <code className="mt-1 block rounded bg-muted px-2 py-1 text-xs">
            {item.armorCalculation.formula}
          </code>
        </div>

        <div>
          <p className="text-muted-foreground">Damage Reduction vs Level 80:</p>
          <p className="font-medium">
            Physical DR: {formatPercent(item.armorCalculation.physicalDR, 1)}{" "}
            (with this piece only)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
