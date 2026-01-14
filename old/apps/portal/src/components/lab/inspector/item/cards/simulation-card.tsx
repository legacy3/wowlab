"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlock } from "@/components/ui/code-block";
import { useItemData } from "../item-context";

export function SimulationCard() {
  const item = useItemData();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Simulation Integration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            Compare in Top Gear
          </Button>
          <Button variant="outline" size="sm">
            Add to Simulation
          </Button>
          <Button variant="outline" size="sm">
            Export SimC String
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">SimC Item String:</p>
          <CodeBlock code={item.simcString} language="text" showCopy={true} />
        </div>
      </CardContent>
    </Card>
  );
}
