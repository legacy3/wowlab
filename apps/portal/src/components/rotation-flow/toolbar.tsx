"use client";

import { memo } from "react";
import {
  Undo2,
  Redo2,
  Expand,
  X,
  Code,
  Eye,
  Grid3X3,
  Download,
  Upload,
  Keyboard,
  LayoutGrid,
  AlignStartVertical,
  ArrowDown,
  ArrowRight,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LayoutDirection } from "./types";

interface ToolbarProps {
  viewMode: "visual" | "code";
  onViewModeChange: (mode: "visual" | "code") => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showMiniMap: boolean;
  onToggleMiniMap: () => void;
  zenMode: boolean;
  onToggleZen: () => void;
  onAutoLayout: () => void;
  nodeCount: number;
  edgeCount: number;
  compactMode?: boolean;
  onToggleCompact?: () => void;
  layoutDirection?: LayoutDirection;
  onLayoutDirectionChange?: (direction: LayoutDirection) => void;
}

export const Toolbar = memo(function Toolbar({
  viewMode,
  onViewModeChange,
  showGrid,
  onToggleGrid,
  showMiniMap,
  onToggleMiniMap,
  zenMode,
  onToggleZen,
  onAutoLayout,
  nodeCount,
  edgeCount,
  compactMode = false,
  onToggleCompact,
  layoutDirection = "vertical",
  onLayoutDirectionChange,
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-0.5 px-1.5 py-0.5 border-b bg-muted/30 text-[10px]">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-5 w-5">
            <Undo2 className="h-2.5 w-2.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px]">
          Undo
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-5 w-5">
            <Redo2 className="h-2.5 w-2.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px]">
          Redo
        </TooltipContent>
      </Tooltip>

      <ToolbarSeparator />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={onAutoLayout}
          >
            <AlignStartVertical className="h-2.5 w-2.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px]">
          Auto Layout (L)
        </TooltipContent>
      </Tooltip>

      {onLayoutDirectionChange && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() =>
                onLayoutDirectionChange(
                  layoutDirection === "vertical" ? "horizontal" : "vertical",
                )
              }
            >
              {layoutDirection === "vertical" ? (
                <ArrowDown className="h-2.5 w-2.5" />
              ) : (
                <ArrowRight className="h-2.5 w-2.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[10px]">
            {layoutDirection === "vertical"
              ? "Vertical Flow"
              : "Horizontal Flow"}
          </TooltipContent>
        </Tooltip>
      )}

      {onToggleCompact && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={compactMode ? "secondary" : "ghost"}
              size="icon"
              className="h-5 w-5"
              onClick={onToggleCompact}
            >
              {compactMode ? (
                <Maximize2 className="h-2.5 w-2.5" />
              ) : (
                <Minimize2 className="h-2.5 w-2.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[10px]">
            {compactMode ? "Normal Size" : "Compact Mode"}
          </TooltipContent>
        </Tooltip>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={showGrid ? "secondary" : "ghost"}
            size="icon"
            className="h-5 w-5"
            onClick={onToggleGrid}
          >
            <Grid3X3 className="h-2.5 w-2.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px]">
          Grid
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={showMiniMap ? "secondary" : "ghost"}
            size="icon"
            className="h-5 w-5"
            onClick={onToggleMiniMap}
          >
            <LayoutGrid className="h-2.5 w-2.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px]">
          Minimap
        </TooltipContent>
      </Tooltip>

      <ToolbarSeparator />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-5 w-5">
            <Upload className="h-2.5 w-2.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="text-[10px]">
          <DropdownMenuItem className="text-[10px]">JSON</DropdownMenuItem>
          <DropdownMenuItem className="text-[10px]">SimC APL</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-5 w-5">
            <Download className="h-2.5 w-2.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="text-[10px]">
          <DropdownMenuItem className="text-[10px]">JSON</DropdownMenuItem>
          <DropdownMenuItem className="text-[10px]">Rhai</DropdownMenuItem>
          <DropdownMenuItem className="text-[10px]">SimC APL</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex-1" />

      <span className="text-muted-foreground tabular-nums px-1">
        {nodeCount}n · {edgeCount}e
      </span>

      <ToolbarSeparator />

      <ToggleGroup
        type="single"
        value={viewMode}
        onValueChange={(v) => v && onViewModeChange(v as "visual" | "code")}
        size="sm"
      >
        <ToggleGroupItem value="visual" className="h-5 w-5 p-0">
          <Eye className="h-2.5 w-2.5" />
        </ToggleGroupItem>
        <ToggleGroupItem value="code" className="h-5 w-5 p-0">
          <Code className="h-2.5 w-2.5" />
        </ToggleGroupItem>
      </ToggleGroup>

      <ToolbarSeparator />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-5 w-5">
            <Keyboard className="h-2.5 w-2.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px]">
          Shortcuts
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={zenMode ? "secondary" : "ghost"}
            size="icon"
            className="h-5 w-5"
            onClick={onToggleZen}
          >
            {zenMode ? (
              <X className="h-2.5 w-2.5" />
            ) : (
              <Expand className="h-2.5 w-2.5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px]">
          {zenMode ? "Exit (ESC)" : "Fullscreen"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
});

function ToolbarSeparator() {
  return <div className="h-3 w-px bg-border mx-0.5" />;
}
