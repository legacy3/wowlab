"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2, Wand2, Package, Sparkles } from "lucide-react";
import type { DataType } from "@/atoms/data-inspector";
import { useDataInspector } from "@/hooks/use-data-inspector";

const DATA_TYPE_LABELS: Record<DataType, string> = {
  spell: "Spell",
  item: "Item",
  aura: "Aura",
};

export function ControlsCard() {
  const { id, setId, type: dataType, setType: setDataType, loading, query } = useDataInspector();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Query Data
        </CardTitle>
        <CardDescription>
          Select a data type and enter an ID to inspect
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs
          value={dataType}
          onValueChange={(v) => setDataType(v as DataType)}
        >
          <TabsList className="w-full">
            <TabsTrigger value="spell" className="flex-1 gap-2">
              <Wand2 className="h-4 w-4" />
              Spell
            </TabsTrigger>
            <TabsTrigger value="item" className="flex-1 gap-2">
              <Package className="h-4 w-4" />
              Item
            </TabsTrigger>
            <TabsTrigger value="aura" className="flex-1 gap-2">
              <Sparkles className="h-4 w-4" />
              Aura
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-2">
          <Label htmlFor="dataId">{DATA_TYPE_LABELS[dataType]} ID</Label>
          <Input
            type="number"
            id="dataId"
            value={id}
            onChange={(e) => setId(parseInt(e.target.value, 10) || 0)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                query();
              }
            }}
            placeholder={`Enter ${dataType} ID...`}
          />
        </div>

        <Button onClick={query} disabled={loading} className="w-full" size="lg">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Querying...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Query {DATA_TYPE_LABELS[dataType]}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
