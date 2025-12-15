"use client";

import { memo } from "react";
import { Download, Expand, X, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SpecLabel } from "@/components/ui/spec-label";
import type { Talent } from "@wowlab/core/Schemas";

interface TalentControlsProps {
  tree: Talent.TalentTree | Talent.TalentTreeWithSelections;
  searchQuery: string;
  scale: number;
  displayNodeCount: number;
  isPanned: boolean;
  zenMode: boolean;
  onSearchChange: (query: string) => void;
  onResetView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleZen: () => void;
  onExportPNG: () => void;
  onExportPDF: () => void;
}

export const TalentControls = memo(function TalentControls({
  tree,
  searchQuery,
  scale,
  displayNodeCount,
  isPanned,
  zenMode,
  onSearchChange,
  onResetView,
  onZoomIn,
  onZoomOut,
  onToggleZen,
  onExportPNG,
  onExportPDF,
}: TalentControlsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <SpecLabel specId={tree.specId} size="sm" showIcon />
      {zenMode && (
        <span className="text-xs text-muted-foreground ml-2 opacity-60">
          (ESC to exit)
        </span>
      )}

      <Input
        placeholder="Search talents..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="h-7 w-36 text-xs"
      />

      <div className="flex items-center gap-1 ml-auto">
        <span className="text-xs text-muted-foreground">
          {displayNodeCount} talents
          {scale !== 1 && ` · ${Math.round(scale * 100)}%`}
        </span>

        <div className="w-px h-4 bg-border mx-1" />

        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={onZoomOut}
          title="Zoom out"
          disabled={scale <= 0.5}
        >
          <ZoomOut className="h-3 w-3" />
        </Button>

        {isPanned && (
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={onResetView}
            title="Reset view"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={onZoomIn}
          title="Zoom in"
          disabled={scale >= 3}
        >
          <ZoomIn className="h-3 w-3" />
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        <Button
          variant={zenMode ? "secondary" : "outline"}
          size="icon"
          className="h-7 w-7"
          onClick={onToggleZen}
          title={zenMode ? "Exit zen mode (ESC)" : "Zen mode"}
        >
          {zenMode ? <X className="h-3 w-3" /> : <Expand className="h-3 w-3" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              title="Download"
            >
              <Download className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onExportPNG}>
              Download PNG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportPDF}>
              Download PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});
