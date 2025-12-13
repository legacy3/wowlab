"use client";

import { memo, useMemo } from "react";
import {
  KonvaGroup,
  KonvaRect,
  KonvaCircle,
  KonvaLine,
} from "@/components/konva";
import type Konva from "konva";
import { getSpell } from "@/atoms/timeline";
import { TRACK_METRICS, getZoomLevel, type ZoomLevel } from "@/hooks/timeline";
import { getSpellOpacity, buildSpellTooltip } from "../timeline-context";
import { formatDamage } from "../utils";

interface DamageEvent {
  id: string;
  spellId: number;
  timestamp: number;
  amount: number;
  isCrit: boolean;
  target: string;
}

interface DamageTrackProps {
  damage: DamageEvent[];
  y: number;
  height: number;
  timeToX: (time: number) => number;
  damageToY: (amount: number) => number;
  visibleRange: { start: number; end: number };
  selectedSpell: number | null;
  showTooltip: (
    e: Konva.KonvaEventObject<MouseEvent>,
    content: React.ReactNode,
  ) => void;
  hideTooltip: () => void;
}

interface DamageBucket {
  timestamp: number;
  totalDamage: number;
  maxDamage: number;
  events: DamageEvent[];
  hasCrit: boolean;
  spellBreakdown: Map<number, { amount: number; count: number; crits: number }>;
}

function getBucketSize(zoomLevel: ZoomLevel): number {
  const { damageBucketSizes } = TRACK_METRICS;

  return damageBucketSizes[zoomLevel];
}

export const DamageTrack = memo(function DamageTrack({
  damage,
  y,
  height,
  timeToX,
  damageToY,
  visibleRange,
  selectedSpell,
  showTooltip,
  hideTooltip,
}: DamageTrackProps) {
  const { damageStemWidth, damageMarkerRadius, damageCritRadius } =
    TRACK_METRICS;
  const zoomLevel = getZoomLevel(visibleRange);
  const bucketSize = getBucketSize(zoomLevel);

  // Create damage buckets based on zoom level
  const damageBuckets = useMemo(() => {
    const buckets = new Map<number, DamageBucket>();

    damage.forEach((dmg) => {
      if (
        dmg.timestamp < visibleRange.start - bucketSize ||
        dmg.timestamp > visibleRange.end + bucketSize
      ) {
        return;
      }

      const bucketKey = Math.floor(dmg.timestamp / bucketSize) * bucketSize;

      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, {
          timestamp: bucketKey,
          totalDamage: 0,
          maxDamage: 0,
          events: [],
          hasCrit: false,
          spellBreakdown: new Map(),
        });
      }

      const bucket = buckets.get(bucketKey)!;
      bucket.totalDamage += dmg.amount;
      bucket.maxDamage = Math.max(bucket.maxDamage, dmg.amount);
      bucket.events.push(dmg);

      if (dmg.isCrit) {
        bucket.hasCrit = true;
      }

      // Track spell breakdown
      const spellData = bucket.spellBreakdown.get(dmg.spellId) ?? {
        amount: 0,
        count: 0,
        crits: 0,
      };

      spellData.amount += dmg.amount;
      spellData.count++;

      if (dmg.isCrit) {
        spellData.crits++;
      }

      bucket.spellBreakdown.set(dmg.spellId, spellData);
    });

    return Array.from(buckets.values()).sort(
      (a, b) => a.timestamp - b.timestamp,
    );
  }, [damage, visibleRange, bucketSize]);

  // Calculate DPS area points for background
  const dpsAreaPoints = useMemo(() => {
    if (damageBuckets.length === 0) {
      return { line: [], area: [] };
    }

    const linePoints: number[] = [];
    const areaPoints: number[] = [];

    // Start area at bottom
    const firstX = timeToX(damageBuckets[0].timestamp);
    areaPoints.push(firstX, height - 5);

    damageBuckets.forEach((bucket) => {
      const x = timeToX(bucket.timestamp + bucketSize / 2);
      const dps = bucket.totalDamage / bucketSize;
      const maxDps = Math.max(
        ...damageBuckets.map((b) => b.totalDamage / bucketSize),
      );
      const normalizedY = height - 5 - (dps / maxDps) * (height - 10);

      linePoints.push(x, normalizedY);
      areaPoints.push(x, normalizedY);
    });

    // Close area
    const lastX = timeToX(
      damageBuckets[damageBuckets.length - 1].timestamp + bucketSize / 2,
    );

    areaPoints.push(lastX, height - 5);

    return { line: linePoints, area: areaPoints };
  }, [damageBuckets, timeToX, height, bucketSize]);

  // Get max damage for scaling
  const maxBucketDamage = useMemo(() => {
    return Math.max(...damageBuckets.map((b) => b.maxDamage), 1);
  }, [damageBuckets]);

  // Render aggregate view (DPS area chart only)
  if (zoomLevel === "aggregate") {
    return (
      <KonvaGroup y={y}>
        {/* DPS area fill */}
        {dpsAreaPoints.area.length > 0 && (
          <KonvaLine
            points={dpsAreaPoints.area}
            fill="#3B82F6"
            opacity={0.25}
            closed
            listening={false}
          />
        )}
        {/* DPS line */}
        {dpsAreaPoints.line.length > 0 && (
          <KonvaLine
            points={dpsAreaPoints.line}
            stroke="#3B82F6"
            strokeWidth={2}
            tension={0.3}
            listening={false}
          />
        )}
      </KonvaGroup>
    );
  }

  // Render coarse view (stacked histogram bars)
  if (zoomLevel === "coarse") {
    return (
      <KonvaGroup y={y}>
        {/* Background DPS area (subtle) */}
        {dpsAreaPoints.area.length > 0 && (
          <KonvaLine
            points={dpsAreaPoints.area}
            fill="#3B82F6"
            opacity={0.1}
            closed
            listening={false}
          />
        )}

        {/* Histogram bars */}
        {damageBuckets.map((bucket) => {
          const x = timeToX(bucket.timestamp);
          const width = Math.max(
            3,
            timeToX(bucket.timestamp + bucketSize) - x - 1,
          );

          // Stack bars by spell
          let currentY = height - 5;
          const spellBars: Array<{
            spellId: number;
            y: number;
            h: number;
            color: string;
          }> = [];

          bucket.spellBreakdown.forEach((data, spellId) => {
            const spell = getSpell(spellId);
            const barHeight = (data.amount / maxBucketDamage) * (height - 10);

            spellBars.push({
              spellId,
              y: currentY - barHeight,
              h: barHeight,
              color: spell?.color ?? "#888",
            });

            currentY -= barHeight;
          });

          const opacity =
            selectedSpell === null
              ? 1
              : bucket.spellBreakdown.has(selectedSpell)
                ? 1
                : 0.2;

          return (
            <KonvaGroup
              key={bucket.timestamp}
              x={x}
              opacity={opacity}
              onMouseEnter={(e: Konva.KonvaEventObject<MouseEvent>) => {
                const spells = Array.from(bucket.spellBreakdown.entries())
                  .map(([id, data]) => {
                    const spell = getSpell(id);
                    return `${spell?.name ?? "Unknown"}: ${formatDamage(data.amount)} (${data.count} hits, ${data.crits} crits)`;
                  })
                  .join("\n");

                showTooltip(
                  e,
                  <div className="text-xs">
                    <div className="font-bold">
                      {bucket.timestamp.toFixed(1)}s -{" "}
                      {(bucket.timestamp + bucketSize).toFixed(1)}s
                    </div>
                    <div>Total: {formatDamage(bucket.totalDamage)}</div>
                    <div className="mt-1 text-muted-foreground whitespace-pre">
                      {spells}
                    </div>
                  </div>,
                );
              }}
              onMouseLeave={hideTooltip}
            >
              {spellBars.map((bar, i) => (
                <KonvaRect
                  key={i}
                  y={bar.y}
                  width={width}
                  height={Math.max(1, bar.h)}
                  fill={bar.color}
                  cornerRadius={1}
                />
              ))}
              {/* Crit indicator - clamped to stay within track */}
              {bucket.hasCrit && (
                <KonvaCircle
                  x={width / 2}
                  y={Math.max(5, currentY - 4)}
                  radius={3}
                  fill="#FFD700"
                  listening={false}
                />
              )}
            </KonvaGroup>
          );
        })}
      </KonvaGroup>
    );
  }

  // Render fine/medium view (lollipop markers)
  return (
    <KonvaGroup y={y}>
      {/* Background DPS area (very subtle) */}
      {dpsAreaPoints.area.length > 0 && (
        <KonvaLine
          points={dpsAreaPoints.area}
          fill="#3B82F6"
          opacity={0.08}
          closed
          listening={false}
        />
      )}

      {/* Individual damage events as lollipops */}
      {damageBuckets.flatMap((bucket) =>
        bucket.events.map((dmg) => {
          const dx = timeToX(dmg.timestamp);
          const spell = getSpell(dmg.spellId);
          const rawY = damageToY(dmg.amount);
          const markerRadius = dmg.isCrit
            ? damageCritRadius
            : damageMarkerRadius;
          const minY = markerRadius + 2;
          const dy = Math.max(minY, rawY);
          const stemHeight = height - 5 - dy;
          const opacity = getSpellOpacity(selectedSpell, dmg.spellId, 1, 0.15);

          return (
            <KonvaGroup
              key={dmg.id}
              x={dx}
              opacity={opacity}
              onMouseEnter={(e: Konva.KonvaEventObject<MouseEvent>) => {
                const tooltip = buildSpellTooltip(dmg.spellId, dmg.timestamp, {
                  damage: dmg.amount,
                  isCrit: dmg.isCrit,
                  target: dmg.target,
                });

                if (tooltip) {
                  showTooltip(e, tooltip);
                }
              }}
              onMouseLeave={hideTooltip}
            >
              {/* Stem */}
              <KonvaRect
                x={-damageStemWidth / 2}
                y={dy}
                width={damageStemWidth}
                height={Math.max(0, stemHeight)}
                fill={spell?.color ?? "#888"}
                cornerRadius={1}
              />
              {/* Marker dot */}
              <KonvaCircle
                x={0}
                y={dy}
                radius={dmg.isCrit ? damageCritRadius : damageMarkerRadius}
                fill={dmg.isCrit ? "#FFD700" : (spell?.color ?? "#888")}
                stroke={dmg.isCrit ? "#FFA500" : undefined}
                strokeWidth={dmg.isCrit ? 1 : 0}
                listening={false}
              />
            </KonvaGroup>
          );
        }),
      )}
    </KonvaGroup>
  );
});
