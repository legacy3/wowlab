"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, GripVertical } from "lucide-react";
import { memo, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Button } from "./button";

interface SortableSectionProps {
  readonly disabled?: boolean;
  readonly id: string;
  readonly keepAlive?: boolean;
  readonly onDragHandlePointerDown?: () => void;
  readonly onToggle: () => void;
  readonly renderContent: () => ReactNode;
  readonly title: string;
  readonly visible: boolean;
}

export const SortableSection = memo(
  ({
    disabled = false,
    id,
    keepAlive = false,
    onDragHandlePointerDown,
    onToggle,
    renderContent,
    title,
    visible,
  }: SortableSectionProps) => {
    const {
      attributes,
      isDragging,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({
      disabled,
      id,
    });

    const style = {
      opacity: isDragging ? 0.5 : undefined,
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const shouldRender = keepAlive || visible;
    const content = shouldRender ? (
      <div
        className={cn("mt-4", visible ? "" : "hidden")}
        aria-hidden={!visible}
        id={`${id}-content`}
      >
        {renderContent()}
      </div>
    ) : null;

    return (
      <section
        ref={setNodeRef}
        data-slot="sortable-section"
        data-dragging={isDragging}
        style={style}
        className={cn(
          "rounded-xl border bg-card/60 p-4 shadow-sm",
          isDragging && "z-50 cursor-grabbing shadow-lg ring-2 ring-primary",
        )}
      >
        <div className="flex items-center gap-3">
          {disabled ? (
            <div className="flex size-9 items-center justify-center rounded-md border border-dashed text-muted-foreground/30">
              <GripVertical className="size-4" />
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
              aria-label={`Drag ${title}`}
              onPointerDown={onDragHandlePointerDown}
              {...attributes}
              {...listeners}
            >
              <GripVertical className="size-4" />
            </Button>
          )}
          <button
            type="button"
            onClick={onToggle}
            className="text-foreground flex flex-1 items-center justify-between text-left font-semibold"
            aria-expanded={visible}
            aria-controls={`${id}-content`}
          >
            <span>{title}</span>
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-150",
                visible && "rotate-180",
              )}
            />
          </button>
        </div>
        {content}
      </section>
    );
  },
);

SortableSection.displayName = "SortableSection";
