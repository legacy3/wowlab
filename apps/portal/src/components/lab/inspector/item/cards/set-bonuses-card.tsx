"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Sparkles } from "lucide-react";
import { useItemData } from "../item-context";

export function SetBonusesCard() {
  const item = useItemData();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Set Bonuses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {item.setInfo ? (
          <div>Set info here</div>
        ) : (
          <Empty className="border-0 py-4">
            <EmptyMedia variant="icon">
              <Sparkles className="h-5 w-5" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle className="text-base">No Set Bonus</EmptyTitle>
              <EmptyDescription>
                This item is not part of a tier set.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {item.relatedSets.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Related Sets:</h4>
            <ul className="space-y-2 text-sm">
              {item.relatedSets.map((set) => (
                <li key={set.name}>
                  <p className="font-medium">{set.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {set.pieces.join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
