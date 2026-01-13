"use client";

import { Server } from "lucide-react";
import { useExtracted } from "next-intl";

import { useClientHardware } from "@/hooks/use-client-hardware";

import { StatCard } from "./stat-card";

export function WorkersCard() {
  const t = useExtracted();
  const { workers } = useClientHardware();

  return <StatCard icon={Server} label={t("Workers")} value={workers} />;
}
