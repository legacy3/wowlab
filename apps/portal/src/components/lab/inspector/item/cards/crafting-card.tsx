"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { useItemData } from "../item-context";

export function CraftingCard() {
  const item = useItemData();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Crafting Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {item.craftingInfo ? (
          <div>Crafting info here</div>
        ) : (
          <Empty className="border-0 py-4">
            <EmptyHeader>
              <EmptyTitle className="text-base">Not Craftable</EmptyTitle>
              <EmptyDescription>
                This item cannot be crafted by players.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {item.similarCraftedItems.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Similar Crafted Items:</h4>
            {item.similarCraftedItems.map((crafted) => (
              <div
                key={crafted.name}
                className="space-y-1 rounded border p-2 text-sm"
              >
                <p className="font-medium">
                  {crafted.name} (iLvl {crafted.itemLevelRange},{" "}
                  {crafted.profession})
                </p>
                <p className="text-xs text-muted-foreground">
                  Recipe: {crafted.recipe}
                </p>
                <p className="text-xs text-muted-foreground">
                  Materials: {crafted.materials.join(", ")}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
