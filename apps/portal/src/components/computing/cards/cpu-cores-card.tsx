"use client";

import { useEffect, useState } from "react";
import { Cpu } from "lucide-react";
import { Card } from "@/components/ui/card";

export function CpuCoresCard() {
  const [cores, setCores] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // TODO Use a proper client side render hook here
      setCores(navigator.hardwareConcurrency || 4);
    }
  }, []);

  return (
    <Card className="h-full p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <Cpu className="h-3.5 w-3.5" />
        CPU Cores
      </div>
      <p className="text-2xl font-bold mt-1 tabular-nums">{cores ?? "—"}</p>
    </Card>
  );
}
