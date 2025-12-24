"use client";

import { useAtomValue } from "jotai";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { jobsAtom } from "@/atoms/computing";

export function StatusCard() {
  const jobs = useAtomValue(jobsAtom);
  const lastError = jobs.find((j) => j.status === "failed")?.error;

  return (
    <Card className="h-full p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        {lastError ? (
          <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
        )}
        Status
      </div>
      <p className="text-2xl font-bold mt-1">{lastError ? "Error" : "OK"}</p>
    </Card>
  );
}
