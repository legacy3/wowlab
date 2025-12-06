"use client";

import { useAtom } from "jotai";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { activeJobsCountAtom } from "@/atoms/computing";

export function ActiveJobsCard() {
  const [activeCount] = useAtom(activeJobsCountAtom);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{activeCount}</div>
        <p className="text-xs text-muted-foreground">Currently running</p>
      </CardContent>
    </Card>
  );
}
