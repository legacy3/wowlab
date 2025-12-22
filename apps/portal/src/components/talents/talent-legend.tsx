"use client";

import { memo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Keyboard,
  Mouse,
  Smartphone,
  Pencil,
  MoveRight,
  Type,
  Circle,
  Hash,
} from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

type LegendTab = "controls" | "annotate";

export const TalentLegend = memo(function TalentLegend() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<LegendTab>("controls");

  return (
    <div className="absolute top-2 right-2 z-10 flex flex-col items-end">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm border rounded-md hover:bg-background/90 transition-colors"
      >
        <HelpCircle className="h-3 w-3" />
        <span>Help</span>
        {isExpanded ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-1 text-xs bg-background/95 backdrop-blur-sm border rounded-md shadow-lg w-[220px]">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              className={cn(
                "flex-1 flex items-center justify-center gap-1 px-2 py-1.5 transition-colors",
                activeTab === "controls"
                  ? "text-foreground border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setActiveTab("controls")}
            >
              <Keyboard className="h-3 w-3" />
              Controls
            </button>
            <button
              className={cn(
                "flex-1 flex items-center justify-center gap-1 px-2 py-1.5 transition-colors",
                activeTab === "annotate"
                  ? "text-foreground border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setActiveTab("annotate")}
            >
              <Pencil className="h-3 w-3" />
              Annotate
            </button>
          </div>

          <div className="p-3">
            {activeTab === "controls" && (
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
                      <span>Pan (override)</span>
                      <Kbd className="text-[10px] h-4">Space + drag</Kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Zoom</span>
                      <Kbd className="text-[10px] h-4">Scroll</Kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Paint</span>
                      <Kbd className="text-[10px] h-4">Drag nodes</Kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Pin tooltip</span>
                      <Kbd className="text-[10px] h-4">Shift + click</Kbd>
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
                      <span>Deselect</span>
                      <Kbd className="text-[10px] h-4">Two-finger tap</Kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Zoom</span>
                      <Kbd className="text-[10px] h-4">Pinch</Kbd>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "annotate" && (
              <div className="space-y-2 text-muted-foreground/80">
                <div className="flex items-start gap-2">
                  <MoveRight className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    <strong>Arrow</strong> — Click + drag
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Circle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    <strong>Circle</strong> — Click + drag
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Type className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    <strong>Text</strong> — Click to place
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Hash className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    <strong>Number</strong> — Click to place
                  </span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span>Delete selected</span>
                    <Kbd className="text-[10px] h-4">Del</Kbd>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span>Undo</span>
                    <Kbd className="text-[10px] h-4">Ctrl/Cmd+Z</Kbd>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span>Redo</span>
                    <Kbd className="text-[10px] h-4">Ctrl/Cmd+Shift+Z</Kbd>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
