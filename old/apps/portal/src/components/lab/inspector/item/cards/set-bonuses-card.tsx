"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useItemData } from "../item-context";

interface SetInfo {
  name: string;
  items: string[];
  bonuses: string[];
}

function isSetInfo(value: unknown): value is SetInfo {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "items" in value &&
    "bonuses" in value
  );
}

export function SetBonusesCard() {
  const item = useItemData();
  const setInfo = isSetInfo(item.setInfo) ? item.setInfo : null;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 shrink-0" />
          Set Bonuses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {setInfo ? (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-yellow-500">
                {setInfo.name}
              </h4>
              <p className="mt-1 text-xs text-muted-foreground">
                {setInfo.items.length} piece
                {setInfo.items.length !== 1 ? "s" : ""} in set
              </p>
            </div>

            {setInfo.bonuses.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-muted-foreground">
                  Set Bonuses:
                </h5>
                <ul className="space-y-1.5">
                  {setInfo.bonuses.map((bonus, i) => (
                    <li
                      key={i}
                      className="rounded border bg-muted/30 px-2 py-1.5 text-sm text-green-500"
                    >
                      {bonus}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {setInfo.items.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-muted-foreground">
                  Set Items:
                </h5>
                <div className="flex flex-wrap gap-1">
                  {setInfo.items.map((itemRef, i) => {
                    const itemIdMatch = itemRef.match(/Item #(\d+)/);
                    const itemId = itemIdMatch ? itemIdMatch[1] : null;

                    return itemId ? (
                      <Link
                        key={i}
                        href={`/lab/inspector/item/${itemId}`}
                        className="transition-colors hover:text-foreground"
                      >
                        <Badge variant="outline" className="cursor-pointer">
                          {itemRef}
                        </Badge>
                      </Link>
                    ) : (
                      <Badge key={i} variant="outline">
                        {itemRef}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
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
