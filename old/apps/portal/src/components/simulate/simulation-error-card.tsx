"use client";

import { AlertCircle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface SimulationErrorCardProps {
  error: Error;
}

export function SimulationErrorCard({ error }: SimulationErrorCardProps) {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-destructive">
              Simulation Failed
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {error.message}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
