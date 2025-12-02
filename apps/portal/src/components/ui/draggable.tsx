"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DraggableProps {
  readonly id: string;
  readonly children: ReactNode;
  readonly className?: string;
}

export function Draggable({ id, children, className }: DraggableProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    opacity: isDragging ? 0.5 : undefined,
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: isDragging ? "grabbing" : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      data-slot="draggable"
      data-dragging={isDragging}
      style={style}
      className={cn("group relative", className)}
    >
      <button
        ref={setActivatorNodeRef}
        data-slot="draggable-handle"
        type="button"
        aria-label="Drag to reorder"
        className={cn(
          "absolute right-2 top-2 z-50 cursor-grab touch-none text-muted-foreground transition-opacity hover:text-foreground active:cursor-grabbing",
          isDragging ? "opacity-100" : "opacity-50 group-hover:opacity-100",
        )}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-5" aria-hidden="true" />
      </button>
      {children}
    </div>
  );
}
