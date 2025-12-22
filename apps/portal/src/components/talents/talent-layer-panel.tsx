"use client";

import { memo } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Plus,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  annotationLayersAtom,
  activeAnnotationLayerIdAtom,
  annotationsAtom,
  addLayerAtom,
  deleteLayerAtom,
  toggleLayerVisibilityAtom,
  toggleLayerLockAtom,
  clearLayerAtom,
} from "@/atoms";

export const TalentLayerPanel = memo(function TalentLayerPanel() {
  const layers = useAtomValue(annotationLayersAtom);
  const annotations = useAtomValue(annotationsAtom);
  const [activeLayerId, setActiveLayerId] = useAtom(
    activeAnnotationLayerIdAtom,
  );
  const addLayer = useSetAtom(addLayerAtom);
  const deleteLayer = useSetAtom(deleteLayerAtom);
  const toggleVisibility = useSetAtom(toggleLayerVisibilityAtom);
  const toggleLock = useSetAtom(toggleLayerLockAtom);
  const clearLayer = useSetAtom(clearLayerAtom);

  // Count annotations per layer
  const countByLayer = (layerId: string) =>
    annotations.filter((a) => a.layerId === layerId).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          title="Layers"
        >
          <Layers className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-64 p-2"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-medium text-muted-foreground">
            Layers
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => addLayer()}
            title="Add layer"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <div className="space-y-0.5">
          {layers.map((layer) => {
            const count = countByLayer(layer.id);
            const isActive = layer.id === activeLayerId;

            return (
              <div
                key={layer.id}
                className={cn(
                  "flex items-center gap-1 px-1.5 py-1 rounded text-sm",
                  "hover:bg-accent/50 cursor-pointer transition-colors",
                  isActive && "bg-accent",
                )}
                onClick={() => setActiveLayerId(layer.id)}
              >
                {/* Active indicator */}
                <div className="w-4 flex-shrink-0">
                  {isActive && <Check className="h-3 w-3 text-primary" />}
                </div>

                {/* Layer name and count */}
                <span className="flex-1 truncate text-xs">
                  {layer.name}
                  {count > 0 && (
                    <span className="text-muted-foreground ml-1">
                      ({count})
                    </span>
                  )}
                </span>

                {/* Visibility toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVisibility(layer.id);
                  }}
                  title={layer.visible ? "Hide layer" : "Show layer"}
                >
                  {layer.visible ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3 text-muted-foreground" />
                  )}
                </Button>

                {/* Lock toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLock(layer.id);
                  }}
                  title={layer.locked ? "Unlock layer" : "Lock layer"}
                >
                  {layer.locked ? (
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <Unlock className="h-3 w-3" />
                  )}
                </Button>

                {/* Delete layer (only if more than 1 layer) */}
                {layers.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteLayer(layer.id);
                    }}
                    title="Delete layer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}

                {/* Clear layer annotations */}
                {count > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearLayer(layer.id);
                    }}
                    title="Clear layer"
                  >
                    <Trash2 className="h-3 w-3 opacity-50" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {layers.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-4">
            No layers yet
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
});
