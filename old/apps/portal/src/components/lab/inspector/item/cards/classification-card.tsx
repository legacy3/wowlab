"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getQualityName, useItemData } from "../item-context";

export function ClassificationCard() {
  const item = useItemData();

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Item Classification
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Class</p>
            <p className="font-medium">
              {item.classification.className} ({item.classification.classId})
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Subclass</p>
            <p className="font-medium">
              {item.classification.subclassName} (
              {item.classification.subclassId})
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Inventory Type</p>
            <p className="font-medium">
              {item.classification.inventoryTypeName} (
              {item.classification.inventoryType})
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Quality</p>
            <p className="font-medium">
              {getQualityName(item.quality)} ({item.quality})
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Expansion</p>
            <p className="font-medium">
              {item.classification.expansionName} (
              {item.classification.expansionId})
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Binding</p>
            <p className="font-medium">
              {item.binding === "BoP" && "Binds when picked up (1)"}
              {item.binding === "BoE" && "Binds when equipped (2)"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
