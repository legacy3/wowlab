"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const RECENT_EXPERIMENTS = [
  {
    name: "Stat Weight Testing",
    date: "2024-01-15",
    runs: 5,
    status: "completed",
  },
  {
    name: "Rotation Optimization",
    date: "2024-01-14",
    runs: 12,
    status: "completed",
  },
  {
    name: "Multi-Target Comparison",
    date: "2024-01-13",
    runs: 8,
    status: "completed",
  },
] as const;

export function WorkbenchRecentExperimentsCard() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Experiments</CardTitle>
        <CardDescription>Your saved workbench configurations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {RECENT_EXPERIMENTS.map((experiment) => (
          <div
            key={experiment.name}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div>
              <p className="font-medium">{experiment.name}</p>
              <p className="text-sm text-muted-foreground">
                {experiment.date} • {experiment.runs} runs
              </p>
            </div>
            <Badge variant="outline">{experiment.status}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
