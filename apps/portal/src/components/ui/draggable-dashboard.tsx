"use client";

import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { type ComponentType, useSyncExternalStore } from "react";

import { Draggable } from "./draggable";
import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils";

export interface DashboardItem {
  readonly Component: ComponentType;
  readonly className?: string;
}

export type DashboardConfig<T extends string> = Record<T, DashboardItem>;

interface DraggableDashboardProps<T extends string> {
  readonly items: readonly T[];
  readonly onReorder: (items: T[]) => void;
  readonly components: DashboardConfig<T>;
  readonly gridClassName?: string;
}

export function DraggableDashboard<T extends string>({
  items,
  onReorder,
  components,
  gridClassName = "grid gap-4 md:auto-rows-min md:grid-cols-3",
}: DraggableDashboardProps<T>) {
  // Prevent hydration mismatch for card orders stored in localStorage
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.indexOf(active.id as T);
    const newIndex = items.indexOf(over.id as T);

    onReorder(arrayMove([...items], oldIndex, newIndex));
  };

  // Show skeleton grid until client has read localStorage
  if (!mounted) {
    return (
      <div className={cn(gridClassName)}>
        {items.map((id) => {
          const { className } = components[id];
          return (
            <Skeleton key={id} className={cn("h-48 rounded-xl", className)} />
          );
        })}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={[...items]} strategy={rectSortingStrategy}>
        <div className={cn(gridClassName)}>
          {items.map((id) => {
            const { Component, className } = components[id];

            return (
              <Draggable key={id} id={id} className={className}>
                <Component />
              </Draggable>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
