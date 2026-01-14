"use client";

import { MemoryStick } from "lucide-react";
import { useExtracted } from "next-intl";

import { useClientHardware } from "@/hooks/use-client-hardware";

import { StatCard } from "./stat-card";

export function MemoryCard() {
  const t = useExtracted();
  const { memory } = useClientHardware();

  return (
    <StatCard
      icon={MemoryStick}
      label={t("Memory")}
      value={memory ? `${memory} GB` : null}
    />
  );
}
