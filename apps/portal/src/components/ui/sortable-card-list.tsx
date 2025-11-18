"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

interface SortableCardProps {
  readonly id: string;
  readonly children: ReactNode;
  readonly title?: string;
}

function SortableCard({ id, children, title }: SortableCardProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    opacity: isDragging ? 0.5 : undefined,
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={cn(
          "cursor-default",
          isDragging && "shadow-lg ring-2 ring-primary",
        )}
      >
        {title && (
          <CardHeader>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground cursor-grab touch-none active:cursor-grabbing"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <CardTitle>{title}</CardTitle>
            </div>
          </CardHeader>
        )}
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}

interface SortableCardListProps {
  readonly items: Array<{
    readonly id: string;
    readonly title?: string;
    readonly content: ReactNode;
  }>;
  readonly onReorder?: (items: Array<{ id: string }>) => void;
}

export function SortableCardList({ items, onReorder }: SortableCardListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localItems, setLocalItems] = useState(items);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    setLocalItems((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const reordered = arrayMove(items, oldIndex, newIndex);
      onReorder?.(reordered);
      return reordered;
    });
  };

  const activeItem = activeId
    ? localItems.find((item) => item.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localItems.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-4">
          {localItems.map((item) => (
            <SortableCard key={item.id} id={item.id} title={item.title}>
              {item.content}
            </SortableCard>
          ))}
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <Card className="opacity-90 shadow-xl ring-2 ring-primary">
            {activeItem.title && (
              <CardHeader>
                <div className="flex items-center gap-2">
                  <GripVertical className="text-primary h-4 w-4" />
                  <CardTitle>{activeItem.title}</CardTitle>
                </div>
              </CardHeader>
            )}
            <CardContent>{activeItem.content}</CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
