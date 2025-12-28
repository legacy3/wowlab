"use client";

import Link from "next/link";
import { Cpu, HelpCircle } from "lucide-react";
import { useClientHardware } from "@/hooks/use-client-hardware";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function CpuCoresCard() {
  const { cores } = useClientHardware();

  return (
    <Card className="h-full p-4">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
        <Cpu className="h-3.5 w-3.5" />
        <span>CPU Cores</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/docs/reference/03-browser-cpu-limits"
              className="hover:text-foreground transition-colors"
            >
              <HelpCircle className="h-3 w-3" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px]">
            Browsers may limit this. Click to learn more.
          </TooltipContent>
        </Tooltip>
      </div>
      <p className="text-2xl font-bold mt-1 tabular-nums">{cores ?? "—"}</p>
    </Card>
  );
}
