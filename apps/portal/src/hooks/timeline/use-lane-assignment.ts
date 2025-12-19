"use client";

import { useMemo } from "react";

export interface LaneAssignmentItem {
  start: number;
  end: number;
}

export interface LaneAssignedItem<T> {
  item: T;
  laneIndex: number;
}

export interface UseLaneAssignmentParams<T extends LaneAssignmentItem> {
  items: T[];
  minGap?: number;
  laneHeight: number;
  laneGap: number;
}

export interface UseLaneAssignmentReturn<T> {
  assignedItems: LaneAssignedItem<T>[];
  laneCount: number;
  totalHeight: number;
}

export function useLaneAssignment<T extends LaneAssignmentItem>({
  items,
  minGap = 0.2,
  laneHeight,
  laneGap,
}: UseLaneAssignmentParams<T>): UseLaneAssignmentReturn<T> {
  return useMemo(() => {
    const sorted = [...items].sort((a, b) => a.start - b.start);
    const lanes: Array<{ endTime: number }> = [];
    const assignedItems: LaneAssignedItem<T>[] = [];

    for (const item of sorted) {
      let assignedLane = -1;

      for (let i = 0; i < lanes.length; i++) {
        if (lanes[i].endTime + minGap < item.start) {
          assignedLane = i;
          break;
        }
      }

      if (assignedLane === -1) {
        assignedLane = lanes.length;
        lanes.push({ endTime: item.end });
      } else {
        lanes[assignedLane].endTime = item.end;
      }

      assignedItems.push({ item, laneIndex: assignedLane });
    }

    const laneCount = lanes.length;
    const totalHeight = Math.max(
      laneCount * laneHeight + (laneCount - 1) * laneGap,
      laneHeight,
    );

    return { assignedItems, laneCount, totalHeight };
  }, [items, minGap, laneHeight, laneGap]);
}

export interface CategoryLaneAssignmentParams<
  T extends LaneAssignmentItem,
  C extends string,
> {
  items: T[];
  getCategory: (item: T) => C;
  categoryOrder: readonly C[];
  minGap?: number;
  laneHeight: number;
  laneGap: number;
  categoryGap: number;
}

export interface CategoryLaneAssignedItem<T, C extends string> {
  item: T;
  category: C;
  categoryIndex: number;
  laneIndex: number;
}

export interface CategoryLaneAssignmentReturn<T, C extends string> {
  assignedItems: CategoryLaneAssignedItem<T, C>[];
  laneCounts: Record<C, number>;
  totalHeight: number;
}

export function useCategoryLaneAssignment<
  T extends LaneAssignmentItem,
  C extends string,
>({
  items,
  getCategory,
  categoryOrder,
  minGap = 0.2,
  laneHeight,
  laneGap,
  categoryGap,
}: CategoryLaneAssignmentParams<T, C>): CategoryLaneAssignmentReturn<T, C> {
  return useMemo(() => {
    const categorized = new Map<C, T[]>();
    for (const cat of categoryOrder) {
      categorized.set(cat, []);
    }

    for (const item of items) {
      const category = getCategory(item);
      const list = categorized.get(category);
      if (list) {
        list.push(item);
      }
    }

    const assignedItems: CategoryLaneAssignedItem<T, C>[] = [];
    const laneCounts = {} as Record<C, number>;
    let currentY = 0;

    for (
      let categoryIndex = 0;
      categoryIndex < categoryOrder.length;
      categoryIndex++
    ) {
      const category = categoryOrder[categoryIndex];
      const categoryItems = categorized.get(category) ?? [];

      if (categoryItems.length === 0) {
        laneCounts[category] = 0;
        continue;
      }

      const sorted = [...categoryItems].sort((a, b) => a.start - b.start);
      const lanes: Array<{ endTime: number }> = [];

      for (const item of sorted) {
        let assignedLane = -1;

        for (let i = 0; i < lanes.length; i++) {
          if (lanes[i].endTime + minGap < item.start) {
            assignedLane = i;
            break;
          }
        }

        if (assignedLane === -1) {
          assignedLane = lanes.length;
          lanes.push({ endTime: item.end });
        } else {
          lanes[assignedLane].endTime = item.end;
        }

        assignedItems.push({
          item,
          category,
          categoryIndex,
          laneIndex: assignedLane,
        });
      }

      laneCounts[category] = lanes.length;
      currentY += lanes.length * (laneHeight + laneGap);
      if (lanes.length > 0) {
        currentY += categoryGap;
      }
    }

    const totalHeight = Math.max(currentY - categoryGap, laneHeight);

    return { assignedItems, laneCounts, totalHeight };
  }, [
    items,
    getCategory,
    categoryOrder,
    minGap,
    laneHeight,
    laneGap,
    categoryGap,
  ]);
}
