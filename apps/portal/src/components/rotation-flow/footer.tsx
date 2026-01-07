"use client";

import { memo } from "react";
import { Play, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FooterProps {
  specLabel?: string;
  onTest?: () => void;
  onSave?: () => void;
}

export const Footer = memo(function Footer({
  specLabel = "BM Hunter",
  onTest,
  onSave,
}: FooterProps) {
  return (
    <div className="flex items-center gap-0.5 px-1.5 py-0.5 border-t bg-muted/30 text-[10px]">
      <Badge variant="outline" className="text-[9px] h-4 px-1">
        {specLabel}
      </Badge>

      <div className="flex-1" />

      <Button
        variant="outline"
        size="sm"
        className="h-5 gap-1 text-[10px] px-1.5"
        onClick={onTest}
      >
        <Play className="h-2.5 w-2.5" />
        Test
      </Button>
      <Button size="sm" className="h-5 gap-1 text-[10px] px-1.5" onClick={onSave}>
        <Save className="h-2.5 w-2.5" />
        Save
      </Button>
    </div>
  );
});
