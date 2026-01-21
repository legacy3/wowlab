"use client";

import { Server } from "lucide-react";
import { useIntlayer } from "next-intlayer";

import { StatCard } from "@/components/ui";
import { useClientHardware } from "@/hooks/use-client-hardware";

export function WorkersCard() {
  const content = useIntlayer("computing").workersCard;
  const { workers } = useClientHardware();

  return <StatCard icon={Server} label={content.workers} value={workers} />;
}
