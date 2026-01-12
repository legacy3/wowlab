"use client";

import type { ReactNode } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon } from "lucide-react";
import { Box, Flex } from "styled-system/jsx";

export interface DragHandleProps {
  attributes: ReturnType<typeof useSortable>["attributes"];
  listeners: ReturnType<typeof useSortable>["listeners"];
  setActivatorNodeRef: (node: HTMLElement | null) => void;
  size?: number;
}

export interface SortableItemProps {
  children: ReactNode;
  className?: string;
  containerProps?: Record<string, unknown>;
  id: string;
  showHandle?: boolean;
}

export interface UseSortableItemReturn {
  attributes: ReturnType<typeof useSortable>["attributes"];
  isDragging: boolean;
  listeners: ReturnType<typeof useSortable>["listeners"];
  setActivatorNodeRef: (node: HTMLElement | null) => void;
  setNodeRef: (node: HTMLElement | null) => void;
  style: React.CSSProperties;
}

interface SortableItemContainerProps {
  children: (props: UseSortableItemReturn) => ReactNode;
  id: string;
}

export function DragHandle({
  attributes,
  listeners,
  setActivatorNodeRef,
  size = 14,
}: DragHandleProps) {
  return (
    <Box
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      cursor="grab"
      color="fg.muted"
      opacity={0.3}
      _hover={{ opacity: 1 }}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      flexShrink={0}
    >
      <GripVerticalIcon size={size} />
    </Box>
  );
}

export function SortableItemContainer({
  children,
  id,
}: SortableItemContainerProps) {
  const sortableProps = useSortableItem(id);
  return <>{children(sortableProps)}</>;
}

export function useSortableItem(id: string): UseSortableItemReturn {
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    opacity: isDragging ? 0.5 : 1,
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    style,
  };
}
