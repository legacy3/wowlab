"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Zap } from "lucide-react";
import { useItemData } from "../item-context";

export function ItemEffectsCard() {
  const item = useItemData();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Item Effects
        </CardTitle>
        <CardDescription>
          On-equip and on-use effects triggered by this item
        </CardDescription>
      </CardHeader>
      <CardContent>
        {item.effects.length > 0 ? (
          <div className="space-y-3">
            {item.effects.map((effect, i) => (
              <div key={i} className="rounded-lg border bg-muted/30 p-3">
                <p className="text-sm text-green-500">{effect}</p>
              </div>
            ))}
          </div>
        ) : (
          <Empty className="border-0 py-4">
            <EmptyMedia variant="icon">
              <Zap className="h-5 w-5" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle className="text-base">No Item Effects</EmptyTitle>
              <EmptyDescription>
                This item has no special on-equip or on-use effects.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}
