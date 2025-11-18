"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function TimelineVisualizationCard() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Timeline Visualization</CardTitle>
        <CardDescription>
          Graphical representation of combat flow
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25">
          <div className="space-y-2 text-center">
            <p className="text-sm text-muted-foreground">
              Interactive timeline visualization coming soon
            </p>
            <p className="text-xs text-muted-foreground">
              Will include ability bars, resource tracking, and event markers
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
