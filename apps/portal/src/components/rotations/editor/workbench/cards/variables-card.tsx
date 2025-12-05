"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const VARIABLE_OPTIONS = [
  { name: "Hit Rating", values: "0-200 by 10", count: 21 },
  { name: "Spell Power", values: "500-1000 by 50", count: 11 },
  { name: "Crit Rating", values: "0-300 by 20", count: 16 },
] as const;

export function WorkbenchVariablesCard() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Variables</CardTitle>
        <CardDescription>Test different parameters</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {VARIABLE_OPTIONS.map((variable) => (
          <div
            key={variable.name}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div>
              <p className="font-medium">{variable.name}</p>
              <p className="text-sm text-muted-foreground">{variable.values}</p>
            </div>
            <Badge variant="secondary">{variable.count} tests</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
