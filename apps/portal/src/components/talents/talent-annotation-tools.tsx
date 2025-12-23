"use client";

import { memo, useMemo } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Circle,
  Hash,
  MousePointer2,
  MoveRight,
  Redo2,
  SlidersHorizontal,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { TalentLayerPanel } from "./talent-layer-panel";
import type { AnnotationTool, AnnotationStyleDefaults } from "@/atoms";
import type { Annotation } from "@/components/konva";
import { gold, success, primary, error, warning, white } from "@/lib/colors";
import {
  ANNOTATION_DEFAULT_OPACITY,
  ANNOTATION_MIN_STROKE_WIDTH,
  ANNOTATION_MAX_STROKE_WIDTH,
  ANNOTATION_TEXT_BG,
  DASH_PATTERNS,
} from "@/components/konva/annotations/constants";

const COLORS = [gold, success, primary, error, warning, white];

interface TalentAnnotationToolsProps {
  activeTool: AnnotationTool;
  activeStyle: AnnotationStyleDefaults;
  selectedAnnotation: Annotation | null;
  hasAnnotations: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onToolChange: (tool: AnnotationTool) => void;
  onStyleChange: (updates: Partial<AnnotationStyleDefaults>) => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

type DashOption = "solid" | "dashed" | "dotted";

export const TalentAnnotationTools = memo(function TalentAnnotationTools({
  activeTool,
  activeStyle,
  selectedAnnotation,
  hasAnnotations,
  canUndo,
  canRedo,
  onToolChange,
  onStyleChange,
  onClear,
  onUndo,
  onRedo,
}: TalentAnnotationToolsProps) {
  const tools: { id: AnnotationTool; icon: React.ReactNode; label: string }[] =
    [
      {
        id: "select",
        icon: <MousePointer2 className="h-3 w-3" />,
        label: "Select",
      },
      {
        id: "arrow",
        icon: <MoveRight className="h-3 w-3" />,
        label: "Arrow",
      },
      { id: "text", icon: <Type className="h-3 w-3" />, label: "Text" },
      {
        id: "circle",
        icon: <Circle className="h-3 w-3" />,
        label: "Circle",
      },
      { id: "number", icon: <Hash className="h-3 w-3" />, label: "Number" },
    ];

  const effectiveTool =
    selectedAnnotation?.type ?? (activeTool === "select" ? null : activeTool);

  const effectiveStyle = useMemo(() => {
    if (!selectedAnnotation) {
      return activeStyle;
    }

    return {
      ...activeStyle,
      color: selectedAnnotation.color ?? activeStyle.color,
      strokeWidth: selectedAnnotation.strokeWidth ?? activeStyle.strokeWidth,
      opacity: selectedAnnotation.opacity ?? activeStyle.opacity,
      dash: selectedAnnotation.dash ?? activeStyle.dash,
      fill:
        "fill" in selectedAnnotation
          ? (selectedAnnotation.fill ?? activeStyle.fill)
          : activeStyle.fill,
      textBackground:
        selectedAnnotation.type === "text"
          ? (selectedAnnotation.backgroundColor ?? activeStyle.textBackground)
          : activeStyle.textBackground,
      fontSize:
        selectedAnnotation.type === "text"
          ? (selectedAnnotation.fontSize ?? activeStyle.fontSize)
          : activeStyle.fontSize,
      fontWeight:
        selectedAnnotation.type === "text"
          ? (selectedAnnotation.fontWeight ?? activeStyle.fontWeight)
          : activeStyle.fontWeight,
      textAlign:
        selectedAnnotation.type === "text"
          ? (selectedAnnotation.align ?? activeStyle.textAlign)
          : activeStyle.textAlign,
      numberSize:
        selectedAnnotation.type === "number"
          ? (selectedAnnotation.size ?? activeStyle.numberSize)
          : activeStyle.numberSize,
      numberFontSize:
        selectedAnnotation.type === "number"
          ? (selectedAnnotation.fontSize ?? activeStyle.numberFontSize)
          : activeStyle.numberFontSize,
      arrowHeadLength:
        selectedAnnotation.type === "arrow"
          ? (selectedAnnotation.headLength ?? activeStyle.arrowHeadLength)
          : activeStyle.arrowHeadLength,
      arrowHeadWidth:
        selectedAnnotation.type === "arrow"
          ? (selectedAnnotation.headWidth ?? activeStyle.arrowHeadWidth)
          : activeStyle.arrowHeadWidth,
    };
  }, [activeStyle, selectedAnnotation]);

  const dashValue: DashOption = useMemo(() => {
    const dash = effectiveStyle.dash ?? [];

    if (dash.length === 0) {
      return "solid";
    }

    if (dash[0] <= 3) {
      return "dotted";
    }

    return "dashed";
  }, [effectiveStyle.dash]);

  const showColorPalette = Boolean(effectiveTool);
  const showStylePanel = Boolean(effectiveTool || selectedAnnotation);

  return (
    <div className="flex items-center gap-0.5">
      <div className="flex items-center border rounded p-px bg-background/80">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6",
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

      {showColorPalette && (
        <div className="flex items-center gap-px border rounded p-px bg-background/80">
          {COLORS.map((color) => (
            <button
              key={color}
              className={cn(
                "h-4 w-4 rounded-sm border transition-transform",
                effectiveStyle.color === color
                  ? "border-foreground scale-110"
                  : "border-transparent hover:scale-105",
              )}
              style={{ backgroundColor: color }}
              onClick={() => onStyleChange({ color })}
              aria-label={`Color ${color}`}
              type="button"
            />
          ))}
        </div>
      )}

      {showStylePanel && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              title="Annotation style"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-64 p-3"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="space-y-3 text-xs">
              <div className="space-y-2">
                <div className="font-medium text-muted-foreground">Stroke</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Width</span>
                    <span className="font-mono text-muted-foreground">
                      {effectiveStyle.strokeWidth}px
                    </span>
                  </div>
                  <Slider
                    min={ANNOTATION_MIN_STROKE_WIDTH}
                    max={ANNOTATION_MAX_STROKE_WIDTH}
                    step={1}
                    value={[effectiveStyle.strokeWidth]}
                    onValueChange={([value]) =>
                      onStyleChange({ strokeWidth: value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Opacity</span>
                    <span className="font-mono text-muted-foreground">
                      {Math.round((effectiveStyle.opacity ?? 1) * 100)}%
                    </span>
                  </div>
                  <Slider
                    min={0.2}
                    max={1}
                    step={0.05}
                    value={[
                      effectiveStyle.opacity ?? ANNOTATION_DEFAULT_OPACITY,
                    ]}
                    onValueChange={([value]) =>
                      onStyleChange({ opacity: value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Dash</span>
                    <span className="text-muted-foreground">{dashValue}</span>
                  </div>
                  <ToggleGroup
                    type="single"
                    value={dashValue}
                    onValueChange={(value) => {
                      if (!value) {
                        return;
                      }

                      onStyleChange({
                        dash: DASH_PATTERNS[value as DashOption],
                      });
                    }}
                    variant="outline"
                    size="sm"
                    spacing={0}
                    className="w-full"
                  >
                    <ToggleGroupItem value="solid" className="flex-1">
                      Solid
                    </ToggleGroupItem>
                    <ToggleGroupItem value="dashed" className="flex-1">
                      Dash
                    </ToggleGroupItem>
                    <ToggleGroupItem value="dotted" className="flex-1">
                      Dot
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>

              {(effectiveTool === "circle" || effectiveTool === "number") && (
                <div className="space-y-2">
                  <div className="font-medium text-muted-foreground">Fill</div>
                  <div className="flex items-center justify-between">
                    <span>Use fill</span>
                    <Switch
                      checked={Boolean(effectiveStyle.fill)}
                      onCheckedChange={(checked) =>
                        onStyleChange({
                          fill: checked ? effectiveStyle.color : null,
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {effectiveTool === "arrow" && (
                <div className="space-y-2">
                  <div className="font-medium text-muted-foreground">Arrow</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Head size</span>
                      <span className="font-mono text-muted-foreground">
                        {effectiveStyle.arrowHeadLength}px
                      </span>
                    </div>
                    <Slider
                      min={10}
                      max={28}
                      step={1}
                      value={[effectiveStyle.arrowHeadLength]}
                      onValueChange={([value]) =>
                        onStyleChange({
                          arrowHeadLength: value,
                          arrowHeadWidth: Math.round(value * 0.65),
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {effectiveTool === "text" && (
                <div className="space-y-2">
                  <div className="font-medium text-muted-foreground">Text</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Size</span>
                      <span className="font-mono text-muted-foreground">
                        {effectiveStyle.fontSize}px
                      </span>
                    </div>
                    <Slider
                      min={12}
                      max={26}
                      step={1}
                      value={[effectiveStyle.fontSize]}
                      onValueChange={([value]) =>
                        onStyleChange({ fontSize: value })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Bold</span>
                    <Switch
                      checked={effectiveStyle.fontWeight >= 600}
                      onCheckedChange={(checked) =>
                        onStyleChange({ fontWeight: checked ? 700 : 500 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Align</span>
                    </div>
                    <ToggleGroup
                      type="single"
                      value={effectiveStyle.textAlign}
                      onValueChange={(value) => {
                        if (!value) {
                          return;
                        }

                        onStyleChange({
                          textAlign: value as "left" | "center" | "right",
                        });
                      }}
                      variant="outline"
                      size="sm"
                      spacing={0}
                      className="w-full"
                    >
                      <ToggleGroupItem value="left" className="flex-1">
                        <AlignLeft className="h-3.5 w-3.5" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="center" className="flex-1">
                        <AlignCenter className="h-3.5 w-3.5" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="right" className="flex-1">
                        <AlignRight className="h-3.5 w-3.5" />
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Background</span>
                    <Switch
                      checked={Boolean(effectiveStyle.textBackground)}
                      onCheckedChange={(checked) =>
                        onStyleChange({
                          textBackground: checked ? ANNOTATION_TEXT_BG : null,
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {effectiveTool === "number" && (
                <div className="space-y-2">
                  <div className="font-medium text-muted-foreground">
                    Number
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Badge size</span>
                      <span className="font-mono text-muted-foreground">
                        {effectiveStyle.numberSize}px
                      </span>
                    </div>
                    <Slider
                      min={20}
                      max={44}
                      step={1}
                      value={[effectiveStyle.numberSize]}
                      onValueChange={([value]) =>
                        onStyleChange({ numberSize: value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Font size</span>
                      <span className="font-mono text-muted-foreground">
                        {effectiveStyle.numberFontSize}px
                      </span>
                    </div>
                    <Slider
                      min={10}
                      max={20}
                      step={1}
                      value={[effectiveStyle.numberFontSize]}
                      onValueChange={([value]) =>
                        onStyleChange({ numberFontSize: value })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}

      <TalentLayerPanel />

      <div className="flex items-center border rounded p-px bg-background/80">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onUndo}
          title="Undo"
          disabled={!canUndo}
        >
          <Undo2 className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onRedo}
          title="Redo"
          disabled={!canRedo}
        >
          <Redo2 className="h-3 w-3" />
        </Button>
      </div>

      {hasAnnotations && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:text-destructive"
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
          title="Clear annotations"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
});
