"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TimelineCooldownUsageCard() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Cooldown Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">12</div>
        <p className="text-xs text-muted-foreground">Major cooldowns used</p>
      </CardContent>
    </Card>
  );
}
