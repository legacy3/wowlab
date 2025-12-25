"use client";

import { Server } from "lucide-react";
import { useClientHardware } from "@/hooks/use-client-hardware";
import { StatCard } from "./stat-card";

export function WorkersCard() {
  const { workers } = useClientHardware();

  return <StatCard icon={Server} label="Workers" value={workers} />;
}
