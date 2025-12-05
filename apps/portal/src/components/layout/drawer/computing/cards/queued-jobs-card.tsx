"use client";

import { useAtom } from "jotai";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { queuedJobsCountAtom } from "@/atoms/computing";

export function QueuedJobsCard() {
  const [queuedCount] = useAtom(queuedJobsCountAtom);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Queued Jobs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{queuedCount}</div>
        <p className="text-xs text-muted-foreground">Waiting to start</p>
      </CardContent>
    </Card>
  );
}
