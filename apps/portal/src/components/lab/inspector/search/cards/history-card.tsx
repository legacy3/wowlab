"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Package, Sparkles, Wand2 } from "lucide-react";
import type { DataType } from "@/atoms/lab";
import { useDataInspector } from "@/hooks/use-data-inspector";

export function HistoryCard() {
  const { history, setId, setType, query } = useDataInspector();

  const handleSelect = (entryId: number, entryType: DataType) => {
    setId(entryId);
    setType(entryType);

    // Query after a microtask to ensure atoms are updated
    queueMicrotask(() => query());
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          History
        </CardTitle>
        <CardDescription>Recent queries this session</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {history.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <History className="h-8 w-8 opacity-30" />
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="space-y-1 pr-4">
              {history.map((entry) => (
                <button
                  key={`${entry.type}-${entry.id}-${entry.timestamp}`}
                  type="button"
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-muted transition-colors text-left"
                  onClick={() => handleSelect(entry.id, entry.type)}
                >
                  {entry.type === "spell" ? (
                    <Wand2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  ) : entry.type === "aura" ? (
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  ) : (
                    <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="font-medium">{entry.id}</span>
                  <span className="text-muted-foreground capitalize">
                    {entry.type}
                  </span>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
