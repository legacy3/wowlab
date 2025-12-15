"use client";

import { memo, useMemo } from "react";
import {
  KonvaGroup,
  KonvaRect,
  KonvaText,
  KonvaLine,
} from "@/components/konva";
import type Konva from "konva";
import { getSpell, type BuffEvent } from "@/atoms/timeline";
import { TRACK_METRICS, getZoomLevel } from "@/hooks/timeline";
import { getSpellOpacity, buildSpellTooltip } from "../timeline-context";
import { getSpellLabel, shouldShowLabel } from "../utils";

type TargetCategory = "boss" | "adds";

function getTargetCategory(target: string | undefined): TargetCategory {
  if (!target) {
    return "boss";
  }

  const lowerTarget = target.toLowerCase();

  const addPatterns = ["add", "wave", "slam", "elemental", "minion"];
  if (addPatterns.some((p) => lowerTarget.includes(p))) {
    return "adds";
  }

  return "boss";
}

const TARGET_ORDER: TargetCategory[] = ["boss", "adds"];

interface DebuffsTrackProps {
  debuffs: BuffEvent[];
  y: number;
  timeToX: (time: number) => number;
  visibleRange: { start: number; end: number };
  selectedSpell?: number | null;
  showTooltip?: (
    e: Konva.KonvaEventObject<MouseEvent>,
    content: React.ReactNode,
  ) => void;
  hideTooltip?: () => void;
}

interface ProcessedDebuff {
  debuff: BuffEvent;
  targetCategory: TargetCategory;
  laneIndex: number;
}

export const DebuffsTrack = memo(function DebuffsTrack({
  debuffs,
  y,
  timeToX,
  visibleRange,
  selectedSpell = null,
  showTooltip,
  hideTooltip,
}: DebuffsTrackProps) {
  const { debuffHeight, debuffGap, debuffDash, debuffCornerRadius } =
    TRACK_METRICS;
  const zoomLevel = getZoomLevel(visibleRange);

  // Process debuffs into target-based lanes with proper overlap handling
  const { processedDebuffs, targetLaneCounts, totalHeight } = useMemo(() => {
    const categorized = new Map<TargetCategory, BuffEvent[]>();
    TARGET_ORDER.forEach((cat) => categorized.set(cat, []));

    debuffs.forEach((debuff) => {
      const category = getTargetCategory(debuff.target);
      categorized.get(category)!.push(debuff);
    });

    const result: ProcessedDebuff[] = [];
    const laneCounts: Record<TargetCategory, number> = {
      boss: 0,
      adds: 0,
    };
    let currentY = 0;

    TARGET_ORDER.forEach((targetCategory) => {
      const categoryDebuffs = categorized.get(targetCategory) ?? [];
      if (categoryDebuffs.length === 0) {
        return;
      }

      const sorted = [...categoryDebuffs].sort((a, b) => a.start - b.start);

      const lanes: Array<{ endTime: number; debuffs: BuffEvent[] }> = [];

      sorted.forEach((debuff) => {
        // Find a lane where this debuff doesn't overlap
        let assignedLane = -1;
        for (let i = 0; i < lanes.length; i++) {
          if (lanes[i].endTime + 0.2 < debuff.start) {
            assignedLane = i;
            break;
          }
        }

        if (assignedLane === -1) {
          // Create new lane
          assignedLane = lanes.length;
          lanes.push({ endTime: debuff.end, debuffs: [debuff] });
        } else {
          // Add to existing lane
          lanes[assignedLane].endTime = debuff.end;
          lanes[assignedLane].debuffs.push(debuff);
        }

        result.push({
          debuff,
          targetCategory,
          laneIndex: assignedLane,
        });
      });

      laneCounts[targetCategory] = lanes.length;
      currentY += lanes.length * (debuffHeight + debuffGap);
    });

    return {
      processedDebuffs: result,
      targetLaneCounts: laneCounts,
      totalHeight: Math.max(currentY - debuffGap, debuffHeight),
    };
  }, [debuffs, debuffHeight, debuffGap]);

  // Filter to visible debuffs
  const visibleDebuffs = useMemo(() => {
    return processedDebuffs.filter(
      ({ debuff }) =>
        debuff.end >= visibleRange.start && debuff.start <= visibleRange.end,
    );
  }, [processedDebuffs, visibleRange.start, visibleRange.end]);

  // Calculate Y position for a debuff
  const getDebuffY = (pd: ProcessedDebuff): number => {
    let yPos = 0;
    const categoryIndex = TARGET_ORDER.indexOf(pd.targetCategory);

    for (let i = 0; i < categoryIndex; i++) {
      const cat = TARGET_ORDER[i];
      const lanes = targetLaneCounts[cat];

      if (lanes > 0) {
        yPos += lanes * (debuffHeight + debuffGap);
      }
    }

    yPos += pd.laneIndex * (debuffHeight + debuffGap);

    return yPos;
  };

  // Render aggregate view (ribbon with thickness = total active debuffs)
  if (zoomLevel === "aggregate") {
    // Bucket debuffs by time to show density
    const bucketSize = 2; // 2 second buckets
    const buckets = new Map<number, { count: number; spells: Set<number> }>();

    debuffs.forEach((debuff) => {
      const startBucket = Math.floor(debuff.start / bucketSize) * bucketSize;
      const endBucket = Math.floor(debuff.end / bucketSize) * bucketSize;

      for (let b = startBucket; b <= endBucket; b += bucketSize) {
        if (b >= visibleRange.start && b <= visibleRange.end) {
          const existing = buckets.get(b);
          if (existing) {
            existing.count++;
            existing.spells.add(debuff.spellId);
          } else {
            buckets.set(b, { count: 1, spells: new Set([debuff.spellId]) });
          }
        }
      }
    });

    const maxCount = Math.max(
      ...Array.from(buckets.values()).map((b) => b.count),
      1,
    );

    return (
      <KonvaGroup y={y}>
        {Array.from(buckets.entries()).map(([timestamp, data]) => {
          const x = timeToX(timestamp);
          const width = timeToX(timestamp + bucketSize) - x;
          const height = (data.count / maxCount) * totalHeight;

          return (
            <KonvaRect
              key={timestamp}
              x={x}
              y={totalHeight - height}
              width={Math.max(2, width - 1)}
              height={height}
              fill="#EF4444"
              opacity={0.5}
              cornerRadius={1}
              listening={false}
            />
          );
        })}
      </KonvaGroup>
    );
  }

  return (
    <KonvaGroup y={y}>
      {/* Target category labels removed - handled by TrackLabels component */}

      {/* Debuff bars */}
      {visibleDebuffs.map(({ debuff, targetCategory, laneIndex }) => {
        const startX = timeToX(debuff.start);
        const endX = timeToX(debuff.end);
        const width = Math.max(4, endX - startX);
        const dy = getDebuffY({ debuff, targetCategory, laneIndex });
        const spell = getSpell(debuff.spellId);
        const opacity = getSpellOpacity(
          selectedSpell,
          debuff.spellId,
          0.7,
          0.25,
        );

        const spellName = spell?.name ?? "";
        const availableWidth = width - 12;
        const label = getSpellLabel(spellName, availableWidth);
        const showLabel = shouldShowLabel(width);

        return (
          <KonvaGroup
            key={debuff.id}
            x={startX}
            y={dy}
            opacity={opacity}
            onMouseEnter={(e: Konva.KonvaEventObject<MouseEvent>) => {
              if (showTooltip) {
                const tooltip = buildSpellTooltip(
                  debuff.spellId,
                  debuff.start,
                  {
                    duration: { start: debuff.start, end: debuff.end },
                    target: debuff.target,
                    stacks: debuff.stacks,
                  },
                );

                if (tooltip) {
                  showTooltip(e, tooltip);
                }
              }
            }}
            onMouseLeave={() => hideTooltip?.()}
          >
            {/* Main bar with dashed border and diagonal pattern */}
            <KonvaRect
              width={width}
              height={debuffHeight}
              fill={spell?.color ?? "#888"}
              opacity={0.4}
              cornerRadius={debuffCornerRadius}
            />
            {/* Dashed border */}
            <KonvaRect
              width={width}
              height={debuffHeight}
              stroke={spell?.color ?? "#888"}
              strokeWidth={1.5}
              cornerRadius={debuffCornerRadius}
              dash={[...debuffDash]}
            />

            {/* Diagonal stripes pattern */}
            {width > 20 && (
              <KonvaGroup clipWidth={width} clipHeight={debuffHeight}>
                {Array.from({ length: Math.ceil(width / 6) + 2 }).map(
                  (_, i) => (
                    <KonvaLine
                      key={i}
                      points={[i * 6 - debuffHeight, debuffHeight, i * 6, 0]}
                      stroke={spell?.color ?? "#888"}
                      strokeWidth={1}
                      opacity={0.3}
                      listening={false}
                    />
                  ),
                )}
              </KonvaGroup>
            )}

            {showLabel && (
              <KonvaText
                text={label.text}
                x={4}
                y={debuffHeight / 2 - 4}
                fontSize={label.fontSize}
                fontStyle={label.showFullName ? undefined : "bold"}
                fill="#fff"
                listening={false}
              />
            )}

            {/* Stack indicator */}
            {debuff.stacks && debuff.stacks > 1 && width > 25 && (
              <KonvaText
                text={String(debuff.stacks)}
                x={width - 12}
                y={debuffHeight / 2 - 4}
                fontSize={8}
                fontStyle="bold"
                fill="#fff"
                listening={false}
              />
            )}
          </KonvaGroup>
        );
      })}
    </KonvaGroup>
  );
});
