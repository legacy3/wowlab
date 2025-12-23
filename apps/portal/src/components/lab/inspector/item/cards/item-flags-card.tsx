"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatHex } from "@/lib/hex";
import { useItemData } from "../item-context";

export function ItemFlagsCard() {
  const item = useItemData();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Item Flags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {item.flags.map((flag) => (
          <div key={flag.index} className="flex items-center gap-2">
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              Flags[{flag.index}]: {formatHex(flag.value)}
            </code>
            {flag.description && (
              <span className="text-muted-foreground">
                - {flag.description}
              </span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
