"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Gem } from "lucide-react";
import { useItemData } from "../item-context";

export function SocketsCard() {
  const item = useItemData();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gem className="h-5 w-5" />
          Sockets & Gems
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {item.sockets.length > 0 ? (
          <div className="space-y-2">
            {item.sockets.map((socket, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded border p-2 text-sm"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded border-2 border-dashed border-muted-foreground">
                  <Gem className="h-3 w-3 text-muted-foreground" />
                </div>
                <span>
                  Socket {i + 1}: [{socket.type}] -{" "}
                  {socket.gem ?? (
                    <span className="text-muted-foreground">Empty</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <Empty className="border-0 py-4">
            <EmptyMedia variant="icon">
              <Gem className="h-5 w-5" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle className="text-base">No Sockets</EmptyTitle>
              <EmptyDescription>This item has no gem sockets.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {item.recommendedGems.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              Recommended Gems (by stat priority):
            </h4>
            <ul className="space-y-1 text-sm">
              {item.recommendedGems.map((gem) => (
                <li key={gem.name} className="text-muted-foreground">
                  {gem.name} ({gem.stats})
                </li>
              ))}
            </ul>
          </div>
        )}

        {item.socketBonus && (
          <p className="text-sm">
            <span className="text-muted-foreground">Socket Bonus:</span>{" "}
            {item.socketBonus}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
