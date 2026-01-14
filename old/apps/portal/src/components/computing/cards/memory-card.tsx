"use client";

import { MemoryStick } from "lucide-react";
import { useClientHardware } from "@/hooks/use-client-hardware";
import { StatCard } from "./stat-card";

export function MemoryCard() {
  const { memory } = useClientHardware();

  return (
    <StatCard
      icon={MemoryStick}
      label="Memory"
      value={memory ? `${memory} GB` : null}
    />
  );
}
