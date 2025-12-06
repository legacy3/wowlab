"use client";

import { useAtom } from "jotai";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { completedJobsCountAtom } from "@/atoms/computing";

export function CompletedJobsCard() {
  const [completedCount] = useAtom(completedJobsCountAtom);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{completedCount}</div>
        <p className="text-xs text-muted-foreground">
          3 hours total compute time
        </p>
      </CardContent>
    </Card>
  );
}
