"use client";

import { memo } from "react";
import {
  Download,
  Expand,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SpecLabel } from "@/components/ui/spec-label";
import { TalentAnnotationTools } from "./talent-annotation-tools";
import type { AnnotationTool } from "@/atoms";
import type {
  TalentPointLimits,
  TalentPointsSpent,
} from "@wowlab/services/Talents";

interface TalentControlsProps {
  specId: number;
  pointLimits: TalentPointLimits;
  searchQuery: string;
  scale: number;
  displayNodeCount: number;
  selectedNodeCount: number;
  pointsSpent: TalentPointsSpent;
  isPanned: boolean;
  zenMode: boolean;
  annotationTool: AnnotationTool;
  annotationColor: string;
  hasAnnotations: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onSearchChange: (query: string) => void;
  onResetView: () => void;
  onResetSelections: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleZen: () => void;
  onExportPNGViewport: () => void;
  onExportPDFViewport: () => void;
  onExportPNGFull: () => void;
  onExportPDFFull: () => void;
  onAnnotationToolChange: (tool: AnnotationTool) => void;
  onAnnotationColorChange: (color: string) => void;
  onAnnotationsClear: () => void;
  onAnnotationsUndo: () => void;
  onAnnotationsRedo: () => void;
}

export const TalentControls = memo(function TalentControls({
  specId,
  pointLimits,
  searchQuery,
  scale,
  displayNodeCount,
  selectedNodeCount,
  pointsSpent,
  isPanned,
  zenMode,
  annotationTool,
  annotationColor,
  hasAnnotations,
  canUndo,
  canRedo,
  onSearchChange,
  onResetView,
  onResetSelections,
  onZoomIn,
  onZoomOut,
  onToggleZen,
  onExportPNGViewport,
  onExportPDFViewport,
  onExportPNGFull,
  onExportPDFFull,
  onAnnotationToolChange,
  onAnnotationColorChange,
  onAnnotationsClear,
  onAnnotationsUndo,
  onAnnotationsRedo,
}: TalentControlsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <SpecLabel specId={specId} size="sm" showIcon />
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

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span
          className={
            pointsSpent.class >= pointLimits.class ? "text-amber-500" : ""
          }
        >
          Class: {pointsSpent.class}/{pointLimits.class}
        </span>
        <span className="opacity-40">·</span>
        <span
          className={
            pointsSpent.spec >= pointLimits.spec ? "text-amber-500" : ""
          }
        >
          Spec: {pointsSpent.spec}/{pointLimits.spec}
        </span>
        <span className="opacity-40">·</span>
        <span
          className={
            pointsSpent.hero >= pointLimits.hero ? "text-amber-500" : ""
          }
        >
          Hero: {pointsSpent.hero}/{pointLimits.hero}
        </span>
      </div>

      <TalentAnnotationTools
        activeTool={annotationTool}
        activeColor={annotationColor}
        hasAnnotations={hasAnnotations}
        canUndo={canUndo}
        canRedo={canRedo}
        onToolChange={onAnnotationToolChange}
        onColorChange={onAnnotationColorChange}
        onClear={onAnnotationsClear}
        onUndo={onAnnotationsUndo}
        onRedo={onAnnotationsRedo}
      />

      <div className="flex items-center gap-1 ml-auto">
        <span className="text-xs text-muted-foreground">
          {selectedNodeCount}/{displayNodeCount} nodes
          {scale !== 1 && ` · ${Math.round(scale * 100)}%`}
        </span>

        <div className="w-px h-4 bg-border mx-1" />

        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={onResetSelections}
          title="Reset selected nodes"
          disabled={selectedNodeCount === 0}
        >
          <RotateCcw className="h-3 w-3" />
        </Button>

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
            <DropdownMenuItem onClick={onExportPNGViewport}>
              Download PNG (viewport)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportPDFViewport}>
              Download PDF (viewport)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportPNGFull}>
              Download PNG (full)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportPDFFull}>
              Download PDF (full)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});
