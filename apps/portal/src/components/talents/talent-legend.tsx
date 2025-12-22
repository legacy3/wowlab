"use client";

import { memo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Keyboard,
  Mouse,
  Smartphone,
} from "lucide-react";
import { Kbd } from "@/components/ui/kbd";

export const TalentLegend = memo(function TalentLegend() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="absolute top-2 right-2 z-10 flex flex-col items-end">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm border rounded-md hover:bg-background/90 transition-colors"
      >
        <Keyboard className="h-3 w-3" />
        <span>Controls</span>
        {isExpanded ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-1 p-3 text-xs bg-background/95 backdrop-blur-sm border rounded-md shadow-lg w-[220px]">
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
                <Keyboard className="h-3 w-3" />
                <span className="font-medium">Keyboard</span>
              </div>
              <div className="space-y-1 text-muted-foreground/80">
                <div className="flex justify-between items-center">
                  <span>Navigate</span>
                  <Kbd className="text-[10px] h-4">Arrows</Kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span>Select</span>
                  <Kbd className="text-[10px] h-4">Enter</Kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span>Deselect</span>
                  <Kbd className="text-[10px] h-4">Backspace</Kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span>Unfocus</span>
                  <Kbd className="text-[10px] h-4">Esc</Kbd>
                </div>
              </div>
            </div>

            <div className="border-t pt-2">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
                <Mouse className="h-3 w-3" />
                <span className="font-medium">Mouse</span>
              </div>
              <div className="space-y-1 text-muted-foreground/80">
                <div className="flex justify-between items-center">
                  <span>Select</span>
                  <Kbd className="text-[10px] h-4">Left click</Kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span>Deselect</span>
                  <Kbd className="text-[10px] h-4">Right click</Kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span>Pan</span>
                  <Kbd className="text-[10px] h-4">Drag</Kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span>Zoom</span>
                  <Kbd className="text-[10px] h-4">Scroll</Kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span>Paint</span>
                  <Kbd className="text-[10px] h-4">Drag nodes</Kbd>
                </div>
              </div>
            </div>

            <div className="border-t pt-2">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
                <Smartphone className="h-3 w-3" />
                <span className="font-medium">Touch</span>
              </div>
              <div className="space-y-1 text-muted-foreground/80">
                <div className="flex justify-between items-center">
                  <span>Tooltip</span>
                  <Kbd className="text-[10px] h-4">Long press</Kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span>Zoom</span>
                  <Kbd className="text-[10px] h-4">Pinch</Kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
