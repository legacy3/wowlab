"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TimelineCastTimeCard() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Cast Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">78%</div>
        <p className="text-xs text-muted-foreground">3:54 of 5:00 casting</p>
      </CardContent>
    </Card>
  );
}
