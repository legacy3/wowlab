"use client";

import { Cpu } from "lucide-react";
import { useClientHardware } from "@/hooks/use-client-hardware";
import { StatCard } from "./stat-card";

export function CpuCoresCard() {
  const { cores } = useClientHardware();

  return <StatCard icon={Cpu} label="CPU Cores" value={cores} />;
}
