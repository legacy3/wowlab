"use client";

import { memo } from "react";
import {
  MousePointer2,
  MoveRight,
  Type,
  Circle,
  Hash,
  Trash2,
  Undo2,
  Redo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TalentLayerPanel } from "./talent-layer-panel";
import type { AnnotationTool } from "@/atoms";
import { gold, success, primary, error, warning, white } from "@/lib/colors";

const COLORS = [gold, success, primary, error, warning, white];

interface TalentAnnotationToolsProps {
  activeTool: AnnotationTool;
  activeColor: string;
  hasAnnotations: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onToolChange: (tool: AnnotationTool) => void;
  onColorChange: (color: string) => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

export const TalentAnnotationTools = memo(function TalentAnnotationTools({
  activeTool,
  activeColor,
  hasAnnotations,
  canUndo,
  canRedo,
  onToolChange,
  onColorChange,
  onClear,
  onUndo,
  onRedo,
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
              aria-label={`Annotation color ${color}`}
              title={`Color ${color}`}
              type="button"
            />
          ))}
        </div>
      )}

      <TalentLayerPanel />

      <div className="flex items-center border rounded-md p-0.5 bg-background/80">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onUndo}
          title="Undo"
          disabled={!canUndo}
        >
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onRedo}
          title="Redo"
          disabled={!canRedo}
        >
          <Redo2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {hasAnnotations && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={() => {
            if (
              !window.confirm(
                "Clear all annotations? You can undo with Ctrl/Cmd+Z.",
              )
            ) {
              return;
            }
            onClear();
          }}
          title="Clear all annotations"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
});
