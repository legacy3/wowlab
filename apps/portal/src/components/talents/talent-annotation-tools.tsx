"use client";

import { memo } from "react";
import {
  MousePointer2,
  MoveRight,
  Type,
  Circle,
  Hash,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AnnotationTool } from "@/hooks/use-annotations";

const COLORS = [
  "#facc15",
  "#22c55e",
  "#3b82f6",
  "#ef4444",
  "#a855f7",
  "#ffffff",
];

interface TalentAnnotationToolsProps {
  activeTool: AnnotationTool;
  activeColor: string;
  hasAnnotations: boolean;
  onToolChange: (tool: AnnotationTool) => void;
  onColorChange: (color: string) => void;
  onClear: () => void;
}

export const TalentAnnotationTools = memo(function TalentAnnotationTools({
  activeTool,
  activeColor,
  hasAnnotations,
  onToolChange,
  onColorChange,
  onClear,
}: TalentAnnotationToolsProps) {
  const tools: { id: AnnotationTool; icon: React.ReactNode; label: string }[] =
    [
      {
        id: "select",
        icon: <MousePointer2 className="h-3.5 w-3.5" />,
        label: "Select",
      },
      {
        id: "arrow",
        icon: <MoveRight className="h-3.5 w-3.5" />,
        label: "Arrow",
      },
      { id: "text", icon: <Type className="h-3.5 w-3.5" />, label: "Text" },
      {
        id: "circle",
        icon: <Circle className="h-3.5 w-3.5" />,
        label: "Circle",
      },
      { id: "number", icon: <Hash className="h-3.5 w-3.5" />, label: "Number" },
    ];

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center border rounded-md p-0.5 bg-background/80">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7",
              activeTool === tool.id && "bg-accent text-accent-foreground",
            )}
            onClick={() =>
              onToolChange(activeTool === tool.id ? null : tool.id)
            }
            title={tool.label}
          >
            {tool.icon}
          </Button>
        ))}
      </div>

      {activeTool && activeTool !== "select" && (
        <div className="flex items-center gap-0.5 border rounded-md p-0.5 bg-background/80">
          {COLORS.map((color) => (
            <button
              key={color}
              className={cn(
                "h-5 w-5 rounded-sm border-2 transition-transform",
                activeColor === color
                  ? "border-foreground scale-110"
                  : "border-transparent hover:scale-105",
              )}
              style={{ backgroundColor: color }}
              onClick={() => onColorChange(color)}
            />
          ))}
        </div>
      )}

      {hasAnnotations && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={onClear}
          title="Clear all annotations"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
});
