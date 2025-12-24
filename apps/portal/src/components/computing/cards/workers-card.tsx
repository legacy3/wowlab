"use client";

import { useEffect, useState } from "react";
import { Server } from "lucide-react";
import { Card } from "@/components/ui/card";

export function WorkersCard() {
  const [workers, setWorkers] = useState<number | null>(null);

  useEffect(() => {
    // TODO Use a proper client side render hook here
    if (typeof window !== "undefined") {
      const cores = navigator.hardwareConcurrency || 4;
      setWorkers(Math.max(2, Math.floor(cores / 2)));
    }
  }, []);

  return (
    <Card className="h-full p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <Server className="h-3.5 w-3.5" />
        Workers
      </div>
      <p className="text-2xl font-bold mt-1 tabular-nums">{workers ?? "—"}</p>
    </Card>
  );
}
