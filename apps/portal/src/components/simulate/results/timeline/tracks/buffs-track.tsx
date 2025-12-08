"use client";

import { memo, useMemo } from "react";
import { Group, Rect, Text, Circle, Line } from "react-konva";
import type Konva from "konva";
import { getSpell, type BuffEvent } from "@/atoms/timeline";
import { TRACK_METRICS, getZoomLevel } from "@/hooks/timeline";
import { getSpellOpacity, buildSpellTooltip } from "../timeline-context";
import { getSpellLabel, shouldShowLabel } from "../utils";

type BuffCategory = "self" | "pet" | "external";

function getBuffCategory(buff: BuffEvent, spellId: number): BuffCategory {
  const petBuffs = [272790];
  if (petBuffs.includes(spellId) || buff.target === "Pet") {
    return "pet";
  }

  const selfBuffs = [19574, 359844, 186265, 393777, 281036];
  if (selfBuffs.includes(spellId) || buff.target === "Player") {
    return "self";
  }

  return "external";
}

const CATEGORY_ORDER: BuffCategory[] = ["self", "pet", "external"];

interface BuffsTrackProps {
  buffs: Map<number, BuffEvent[]>;
  y: number;
  timeToX: (time: number) => number;
  visibleRange: { start: number; end: number };
  selectedSpell: number | null;
  showTooltip: (
    e: Konva.KonvaEventObject<MouseEvent>,
    content: React.ReactNode,
  ) => void;
  hideTooltip: () => void;
}

interface ProcessedBuff {
  buff: BuffEvent;
  category: BuffCategory;
  categoryIndex: number;
  laneIndex: number;
  refreshMarks: number[];
}

export const BuffsTrack = memo(function BuffsTrack({
  buffs,
  y,
  timeToX,
  visibleRange,
  selectedSpell,
  showTooltip,
  hideTooltip,
}: BuffsTrackProps) {
  const { buffHeight, buffGap, buffCornerRadius, buffCategoryGap } =
    TRACK_METRICS;
  const zoomLevel = getZoomLevel(visibleRange);

  // Process buffs into categories with lane assignment
  const { processedBuffs, categoryLaneCounts } = useMemo(() => {
    const categorized = new Map<BuffCategory, Map<number, BuffEvent[]>>();

    // Group by category, then by spell
    buffs.forEach((spellBuffs, spellId) => {
      spellBuffs.forEach((buff) => {
        const category = getBuffCategory(buff, spellId);
        if (!categorized.has(category)) {
          categorized.set(category, new Map());
        }

        const catMap = categorized.get(category)!;
        if (!catMap.has(spellId)) {
          catMap.set(spellId, []);
        }

        catMap.get(spellId)!.push(buff);
      });
    });

    const result: ProcessedBuff[] = [];
    const laneCounts: Record<BuffCategory, number> = {
      self: 0,
      pet: 0,
      external: 0,
    };
    let currentY = 0;

    CATEGORY_ORDER.forEach((category, categoryIndex) => {
      const categoryBuffs = categorized.get(category);
      if (!categoryBuffs || categoryBuffs.size === 0) {
        return;
      }

      let laneIndex = 0;
      categoryBuffs.forEach((spellBuffs) => {
        const sorted = [...spellBuffs].sort((a, b) => a.start - b.start);

        const merged: Array<{ buff: BuffEvent; refreshMarks: number[] }> = [];
        sorted.forEach((buff) => {
          const last = merged[merged.length - 1];
          if (last && buff.start <= last.buff.end + 0.5) {
            // Overlapping or very close - merge and mark refresh
            last.refreshMarks.push(buff.start);
            last.buff = {
              ...last.buff,
              end: Math.max(last.buff.end, buff.end),
              stacks: Math.max(last.buff.stacks ?? 1, buff.stacks ?? 1),
            };
          } else {
            merged.push({ buff, refreshMarks: [] });
          }
        });

        merged.forEach(({ buff, refreshMarks }) => {
          result.push({
            buff,
            category,
            categoryIndex,
            laneIndex,
            refreshMarks,
          });
        });

        laneIndex++;
      });

      laneCounts[category] = laneIndex;
      currentY += laneIndex * (buffHeight + buffGap);

      if (laneIndex > 0) {
        currentY += buffCategoryGap;
      }
    });

    return {
      processedBuffs: result,
      categoryLaneCounts: laneCounts,
      totalHeight: Math.max(currentY - buffCategoryGap, buffHeight),
    };
  }, [buffs, buffHeight, buffGap, buffCategoryGap]);

  // Filter to visible buffs
  const visibleBuffs = useMemo(() => {
    return processedBuffs.filter(
      ({ buff }) =>
        buff.end >= visibleRange.start && buff.start <= visibleRange.end,
    );
  }, [processedBuffs, visibleRange.start, visibleRange.end]);

  // Calculate Y position for a buff
  const getBuffY = (pb: ProcessedBuff): number => {
    let y = 0;
    for (let i = 0; i < pb.categoryIndex; i++) {
      const cat = CATEGORY_ORDER[i];
      const lanes = categoryLaneCounts[cat];

      if (lanes > 0) {
        y += lanes * (buffHeight + buffGap) + buffCategoryGap;
      }
    }

    y += pb.laneIndex * (buffHeight + buffGap);

    return y;
  };

  // Render envelope view for aggregate zoom
  if (zoomLevel === "aggregate") {
    return (
      <Group y={y}>
        {visibleBuffs.map(
          ({ buff, category, categoryIndex, laneIndex, refreshMarks }) => {
            const startX = timeToX(buff.start);
            const endX = timeToX(buff.end);
            const width = Math.max(4, endX - startX);
            const by = getBuffY({
              buff,
              category,
              categoryIndex,
              laneIndex,
              refreshMarks,
            });
            const spell = getSpell(buff.spellId);
            const opacity = getSpellOpacity(
              selectedSpell,
              buff.spellId,
              0.7,
              0.2,
            );

            // Calculate uptime opacity based on duration vs visible range
            const visibleDuration =
              Math.min(buff.end, visibleRange.end) -
              Math.max(buff.start, visibleRange.start);
            const rangeDuration = visibleRange.end - visibleRange.start;
            const uptimeRatio = visibleDuration / rangeDuration;

            return (
              <Group key={buff.id} x={startX} y={by} opacity={opacity}>
                {/* Start marker */}
                <Rect
                  x={0}
                  y={0}
                  width={3}
                  height={buffHeight}
                  fill={spell?.color ?? "#888"}
                  cornerRadius={1}
                  perfectDrawEnabled={false}
                />
                {/* Connecting line */}
                <Line
                  points={[3, buffHeight / 2, width - 3, buffHeight / 2]}
                  stroke={spell?.color ?? "#888"}
                  strokeWidth={1}
                  opacity={Math.max(0.3, uptimeRatio)}
                  dash={[4, 4]}
                  listening={false}
                  perfectDrawEnabled={false}
                />
                {/* End marker */}
                <Rect
                  x={width - 3}
                  y={0}
                  width={3}
                  height={buffHeight}
                  fill={spell?.color ?? "#888"}
                  cornerRadius={1}
                  perfectDrawEnabled={false}
                />
              </Group>
            );
          },
        )}
      </Group>
    );
  }

  return (
    <Group y={y}>
      {/* Buff bars */}
      {visibleBuffs.map(
        ({ buff, category, categoryIndex, laneIndex, refreshMarks }) => {
          const startX = timeToX(buff.start);
          const endX = timeToX(buff.end);
          const width = Math.max(4, endX - startX);
          const by = getBuffY({
            buff,
            category,
            categoryIndex,
            laneIndex,
            refreshMarks,
          });
          const spell = getSpell(buff.spellId);
          const opacity = getSpellOpacity(
            selectedSpell,
            buff.spellId,
            0.85,
            0.3,
          );

          const spellName = spell?.name ?? "";
          const availableWidth = width - 12;
          const label = getSpellLabel(spellName, availableWidth);
          const showLabel = shouldShowLabel(width);

          return (
            <Group
              key={buff.id}
              x={startX}
              y={by}
              opacity={opacity}
              onMouseEnter={(e) => {
                const tooltip = buildSpellTooltip(buff.spellId, buff.start, {
                  duration: { start: buff.start, end: buff.end },
                  stacks: buff.stacks,
                  refreshCount: refreshMarks.length,
                });

                if (tooltip) {
                  showTooltip(e, tooltip);
                }
              }}
              onMouseLeave={hideTooltip}
            >
              {/* Main bar */}
              <Rect
                width={width}
                height={buffHeight}
                fill={spell?.color ?? "#888"}
                cornerRadius={buffCornerRadius}
                perfectDrawEnabled={false}
              />

              {/* Refresh marks */}
              {refreshMarks.map((markTime, i) => {
                const markX = timeToX(markTime) - startX;
                if (markX < 2 || markX > width - 2) {
                  return null;
                }

                return (
                  <Line
                    key={i}
                    points={[markX, 2, markX, buffHeight - 2]}
                    stroke="#fff"
                    strokeWidth={1}
                    opacity={0.4}
                    listening={false}
                    perfectDrawEnabled={false}
                  />
                );
              })}

              {showLabel && (
                <Text
                  text={label.text}
                  x={4}
                  y={buffHeight / 2 - 5}
                  fontSize={label.fontSize}
                  fontStyle={label.showFullName ? "500" : "bold"}
                  fill="#fff"
                  listening={false}
                  perfectDrawEnabled={false}
                />
              )}

              {/* Stack badge (at right edge, inside bar) */}
              {buff.stacks && buff.stacks > 1 && (
                <Group x={width - 14} y={buffHeight / 2 - 6}>
                  <Circle
                    x={6}
                    y={6}
                    radius={6}
                    fill="#000"
                    opacity={0.6}
                    listening={false}
                    perfectDrawEnabled={false}
                  />
                  <Text
                    text={String(buff.stacks)}
                    x={0}
                    y={2}
                    width={12}
                    align="center"
                    fontSize={8}
                    fontStyle="bold"
                    fill="#fff"
                    listening={false}
                    perfectDrawEnabled={false}
                  />
                </Group>
              )}
            </Group>
          );
        },
      )}
    </Group>
  );
});
