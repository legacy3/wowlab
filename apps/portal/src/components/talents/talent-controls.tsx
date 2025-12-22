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
  Image,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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

function PointsDisplay({
  label,
  spent,
  limit,
}: {
  label: string;
  spent: number;
  limit: number;
}) {
  const isCapped = spent >= limit;
  return (
    <span className={isCapped ? "text-amber-500" : ""}>
      {label}: {spent}/{limit}
    </span>
  );
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
    <div className="flex items-center gap-1.5 text-xs">
      {/* Left: Spec + Points */}
      <div className="flex items-center gap-2 shrink-0">
        <SpecLabel specId={specId} size="sm" showIcon showChevron={false} />
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1 text-muted-foreground tabular-nums">
          <PointsDisplay
            label="C"
            spent={pointsSpent.class}
            limit={pointLimits.class}
          />
          <span className="opacity-40">·</span>
          <PointsDisplay
            label="S"
            spent={pointsSpent.spec}
            limit={pointLimits.spec}
          />
          <span className="opacity-40">·</span>
          <PointsDisplay
            label="H"
            spent={pointsSpent.hero}
            limit={pointLimits.hero}
          />
        </div>
      </div>

      {/* Center: Search */}
      <Input
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="h-6 w-28 text-xs mx-1"
      />

      {/* Annotation Tools */}
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

      {/* Right: Actions */}
      <div className="flex items-center gap-0.5 ml-auto">
        {scale !== 1 && (
          <span className="text-muted-foreground tabular-nums px-1">
            {Math.round(scale * 100)}%
          </span>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onResetSelections}
          title="Reset talents"
          disabled={selectedNodeCount === 0}
        >
          <RotateCcw className="h-3 w-3" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onZoomOut}
          title="Zoom out"
          disabled={scale <= 0.5}
        >
          <ZoomOut className="h-3 w-3" />
        </Button>

        {isPanned && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onResetView}
            title="Reset view"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onZoomIn}
          title="Zoom in"
          disabled={scale >= 3}
        >
          <ZoomIn className="h-3 w-3" />
        </Button>

        <Button
          variant={zenMode ? "secondary" : "ghost"}
          size="icon"
          className="h-6 w-6"
          onClick={onToggleZen}
          title={zenMode ? "Exit fullscreen (ESC)" : "Fullscreen"}
        >
          {zenMode ? <X className="h-3 w-3" /> : <Expand className="h-3 w-3" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              title="Export"
            >
              <Download className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs">
                <Image className="h-3 w-3 mr-2" />
                PNG
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onClick={onExportPNGViewport}
                  className="text-xs"
                >
                  Viewport
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExportPNGFull} className="text-xs">
                  Full tree
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs">
                <FileText className="h-3 w-3 mr-2" />
                PDF
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onClick={onExportPDFViewport}
                  className="text-xs"
                >
                  Viewport
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExportPDFFull} className="text-xs">
                  Full tree
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});
