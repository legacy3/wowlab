"use client";

import { MemoryStick } from "lucide-react";
import { useIntlayer } from "next-intlayer";

import { StatCard } from "@/components/ui";
import { useClientHardware } from "@/hooks/use-client-hardware";

export function MemoryCard() {
  const content = useIntlayer("computing").memoryCard;
  const { memory } = useClientHardware();

  return (
    <StatCard
      icon={MemoryStick}
      label={content.memory}
      value={memory ? `${memory} GB` : null}
    />
  );
}
