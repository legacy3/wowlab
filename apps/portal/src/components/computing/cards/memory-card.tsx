"use client";

import { useEffect, useState } from "react";
import { MemoryStick } from "lucide-react";
import { Card } from "@/components/ui/card";

export function MemoryCard() {
  const [memory, setMemory] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setMemory(
        (navigator as Navigator & { deviceMemory?: number }).deviceMemory ??
          null,
      );
    }
  }, []);

  return (
    <Card className="h-full p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <MemoryStick className="h-3.5 w-3.5" />
        Memory
      </div>
      <p className="text-2xl font-bold mt-1 tabular-nums">
        {memory ? `${memory} GB` : "—"}
      </p>
    </Card>
  );
}
