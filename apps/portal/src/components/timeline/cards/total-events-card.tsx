"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TimelineTotalEventsCard() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Total Events</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">847</div>
        <p className="text-xs text-muted-foreground">Over 5:00 duration</p>
      </CardContent>
    </Card>
  );
}
