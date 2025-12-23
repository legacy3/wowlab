"use client";

import { GameIcon } from "@/components/game/game-icon";
import { QUALITY_COLORS } from "@/components/game/game-tooltip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { getQualityName, useItemData } from "../item-context";
import { formatInt } from "@/lib/format";

export function HeaderCard() {
  const item = useItemData();
  const qualityColor = QUALITY_COLORS[item.quality];

  return (
    <Card className="h-full">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div
            className="shrink-0 overflow-hidden rounded-lg border-2"
            style={{ borderColor: qualityColor }}
          >
            <GameIcon iconName={item.iconName} size="large" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1
                className="text-2xl font-bold"
                style={{ color: qualityColor }}
              >
                {item.name}
              </h1>
              <div className="flex items-center gap-1">
                <Badge variant="outline">Item #{item.id}</Badge>
                <CopyButton
                  value={item.id.toString()}
                  label="item ID"
                  title="Copy item ID"
                />
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="font-medium text-yellow-500">
                Item Level {item.itemLevel}
              </span>
              <span style={{ color: qualityColor }}>
                {getQualityName(item.quality)} Quality
              </span>
              <span className="text-muted-foreground">
                {item.binding === "BoP" && "Binds when picked up"}
                {item.binding === "BoE" && "Binds when equipped"}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <span>{item.classification.inventoryTypeName}</span>
              <span>{item.classification.subclassName} Armor</span>
            </div>

            <div className="mt-4 space-y-1">
              <p className="text-sm">
                <span className="text-muted-foreground">
                  {formatInt(item.armor)}
                </span>{" "}
                Armor
              </p>
              {item.primaryStats.map((stat) => (
                <p key={stat.name} className="text-sm">
                  +{formatInt(stat.value)} {stat.name}
                </p>
              ))}
              {item.secondaryStats.map((stat) => (
                <p key={stat.name} className="text-sm text-green-500">
                  +{formatInt(stat.rating)} {stat.name}
                </p>
              ))}
              {item.sockets.map((socket, i) => (
                <p key={i} className="text-sm text-muted-foreground">
                  [{socket.type} Socket]
                </p>
              ))}
              <p className="text-sm text-muted-foreground">
                Requires Level {formatInt(item.requiredLevel)}
              </p>
              {item.description && (
                <p className="mt-2 text-sm italic text-yellow-500">
                  &quot;{item.description}&quot;
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
