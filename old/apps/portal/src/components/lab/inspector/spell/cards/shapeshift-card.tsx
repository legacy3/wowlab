"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { useSpellData } from "../spell-context";

export function ShapeshiftCard() {
  const spell = useSpellData();
  const { shapeshiftRequirements } = spell;
  const hasRequirements =
    shapeshiftRequirements.requiredForms.length > 0 ||
    shapeshiftRequirements.excludedForms.length > 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Shapeshift Requirements</CardTitle>
      </CardHeader>
      <CardContent>
        {hasRequirements ? (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Required Forms:</p>
              <p className="text-muted-foreground">
                {shapeshiftRequirements.requiredForms.length > 0
                  ? shapeshiftRequirements.requiredForms.join(", ")
                  : "None (usable in any form)"}
              </p>
            </div>
            <div>
              <p className="font-medium">Excluded Forms:</p>
              <p className="text-muted-foreground">
                {shapeshiftRequirements.excludedForms.length > 0
                  ? shapeshiftRequirements.excludedForms.join(", ")
                  : "None"}
              </p>
            </div>
          </div>
        ) : (
          <Empty className="border-0 py-4">
            <EmptyHeader>
              <EmptyTitle className="text-base">No Requirements</EmptyTitle>
              <EmptyDescription>
                Usable in any shapeshift form.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}
