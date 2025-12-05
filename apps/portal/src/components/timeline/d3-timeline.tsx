"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  select,
  axisBottom,
  brushX,
  type BrushBehavior,
  type D3BrushEvent,
} from "d3";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  combatDataAtom,
  timelineBoundsAtom,
  buffsBySpellAtom,
  debuffsAtom,
  uniqueSpellsAtom,
  maxDamageAtom,
  expandedTracksAtom,
  selectedSpellAtom,
  hoveredSpellAtom,
  viewRangeAtom,
  formatDamage,
  formatTime,
  getSpell,
  type TrackId,
  type CastEvent,
} from "@/atoms/timeline";

import {
  useTimelineScales,
  useTimelineZoom,
  useTrackLayout,
  useResizeObserver,
  useThrottledCallback,
  TRACK_CONFIGS,
} from "./hooks";

// =============================================================================
// Constants
// =============================================================================

const MARGIN = { top: 10, right: 20, bottom: 30, left: 90 } as const;
const MINIMAP_HEIGHT = 40;
const CAST_SIZE = 24;

// =============================================================================
// Tooltip Component
// =============================================================================

interface TooltipState {
  x: number;
  y: number;
  content: React.ReactNode;
}

function TimelineTooltip({ tooltip }: { tooltip: TooltipState | null }) {
  if (!tooltip) return null;

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: tooltip.x,
        top: tooltip.y - 10,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
        {tooltip.content}
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function D3Timeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const minimapRef = useRef<SVGSVGElement>(null);

  // Atoms
  const combatData = useAtomValue(combatDataAtom);
  const bounds = useAtomValue(timelineBoundsAtom);
  const buffsBySpell = useAtomValue(buffsBySpellAtom);
  const debuffs = useAtomValue(debuffsAtom);
  const uniqueSpells = useAtomValue(uniqueSpellsAtom);
  const maxDamage = useAtomValue(maxDamageAtom);
  const [expandedTracks, setExpandedTracks] = useAtom(expandedTracksAtom);
  const [selectedSpell, setSelectedSpell] = useAtom(selectedSpellAtom);
  const [hoveredSpell, setHoveredSpell] = useAtom(hoveredSpellAtom);
  const [viewRange, setViewRange] = useAtom(viewRangeAtom);

  // Local state
  const [transform, setTransform] = useState<{ k: number; x: number } | null>(
    null,
  );
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Container size
  const { width: containerWidth } = useResizeObserver(containerRef);
  const innerWidth = Math.max(0, containerWidth - MARGIN.left - MARGIN.right);

  // Track layout
  const { tracks, totalHeight } = useTrackLayout(expandedTracks);

  // Scales
  const { x, damageY, resourceY, focusArea, focusLine } = useTimelineScales({
    bounds,
    innerWidth,
    damageTrackHeight: tracks.damage.height,
    resourceTrackHeight: tracks.resources.height,
    maxDamage,
    transform,
  });

  // Throttled tooltip setter
  const throttledSetTooltip = useThrottledCallback(setTooltip, 16);

  // Zoom handlers
  const handleZoom = useCallback((newTransform: { k: number; x: number }) => {
    setTransform(newTransform);
  }, []);

  const { zoomIn, zoomOut, resetZoom } = useTimelineZoom({
    svgRef,
    innerWidth,
    totalHeight,
    onZoom: handleZoom,
  });

  // Update view range when scale changes
  useEffect(() => {
    if (innerWidth > 0) {
      const domain = x.domain();
      setViewRange({ start: domain[0], end: domain[1] });
    }
  }, [x, innerWidth, setViewRange]);

  // Toggle track expansion
  const toggleTrack = useCallback(
    (trackId: TrackId) => {
      setExpandedTracks((prev) => {
        const next = new Set(prev);
        if (next.has(trackId)) {
          next.delete(trackId);
        } else {
          next.add(trackId);
        }
        return next;
      });
    },
    [setExpandedTracks],
  );

  // ==========================================================================
  // D3 Rendering Effects
  // ==========================================================================

  // Render grid and background
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || innerWidth <= 0) return;

    const root = select(svg);

    // Update SVG dimensions
    root
      .attr("width", containerWidth)
      .attr("height", totalHeight + MARGIN.top + MARGIN.bottom)
      .attr(
        "viewBox",
        `0 0 ${containerWidth} ${totalHeight + MARGIN.top + MARGIN.bottom}`,
      );

    // Get or create main group
    let g = root.select<SVGGElement>("g.main-group");
    if (g.empty()) {
      g = root.append("g").attr("class", "main-group");
    }
    g.attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    // Background
    let bg = g.select<SVGRectElement>("rect.background");
    if (bg.empty()) {
      bg = g.append("rect").attr("class", "background");
    }
    bg.attr("width", innerWidth)
      .attr("height", totalHeight)
      .attr("fill", "hsl(var(--card))")
      .attr("rx", 4);

    // Grid lines using data join
    const ticks = x.ticks(20);
    const gridGroup = g.selectAll<SVGGElement, unknown>("g.grid").data([null]);
    const gridEnter = gridGroup.enter().append("g").attr("class", "grid");
    const grid = gridEnter.merge(gridGroup);

    const lines = grid.selectAll<SVGLineElement, number>("line").data(ticks);

    lines
      .enter()
      .append("line")
      .merge(lines)
      .attr("x1", (d) => x(d))
      .attr("x2", (d) => x(d))
      .attr("y1", 0)
      .attr("y2", totalHeight)
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-opacity", (d) => (d % 10 === 0 ? 0.4 : 0.15))
      .attr("stroke-dasharray", (d) => (d % 10 === 0 ? "none" : "2,2"));

    lines.exit().remove();

    // X Axis
    let axisGroup = g.select<SVGGElement>("g.x-axis");
    if (axisGroup.empty()) {
      axisGroup = g.append("g").attr("class", "x-axis");
    }
    axisGroup.attr("transform", `translate(0,${totalHeight})`).call(
      axisBottom(x)
        .ticks(10)
        .tickFormat((d) => formatTime(d as number)),
    );

    axisGroup
      .selectAll("text")
      .attr("fill", "hsl(var(--muted-foreground))")
      .attr("font-size", "11px");

    axisGroup.selectAll("path, line").attr("stroke", "hsl(var(--border))");
  }, [containerWidth, innerWidth, totalHeight, x]);

  // Render phases track
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !tracks.phases.visible || innerWidth <= 0) return;

    const g = select(svg).select<SVGGElement>("g.main-group");
    if (g.empty()) return;

    // Get or create phases group
    let phasesGroup = g.select<SVGGElement>("g.phases-track");
    if (phasesGroup.empty()) {
      phasesGroup = g.append("g").attr("class", "phases-track");
    }
    phasesGroup.attr("transform", `translate(0,${tracks.phases.y})`);

    // Phase rectangles - using modern join() pattern
    phasesGroup
      .selectAll<SVGRectElement, (typeof combatData.phases)[0]>("rect.phase")
      .data(combatData.phases, (d) => d.id)
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("class", "phase")
            .attr("opacity", 0)
            .call((sel) => sel.transition().duration(300).attr("opacity", 0.2)),
        (update) => update,
        (exit) => exit.transition().duration(200).attr("opacity", 0).remove(),
      )
      .attr("x", (d) => x(d.start))
      .attr("y", 2)
      .attr("width", (d) => Math.max(0, x(d.end) - x(d.start)))
      .attr("height", tracks.phases.height - 4)
      .attr("fill", (d) => d.color)
      .attr("rx", 2);

    // Phase labels - using join()
    phasesGroup
      .selectAll<SVGTextElement, (typeof combatData.phases)[0]>("text.phase-label")
      .data(
        combatData.phases.filter((p) => x(p.end) - x(p.start) > 50),
        (d) => d.id,
      )
      .join(
        (enter) =>
          enter
            .append("text")
            .attr("class", "phase-label")
            .attr("opacity", 0)
            .call((sel) => sel.transition().duration(300).attr("opacity", 1)),
        (update) => update,
        (exit) => exit.transition().duration(200).attr("opacity", 0).remove(),
      )
      .attr("x", (d) => x(d.start) + (x(d.end) - x(d.start)) / 2)
      .attr("y", tracks.phases.height / 2 + 4)
      .attr("text-anchor", "middle")
      .attr("fill", (d) => d.color)
      .attr("font-size", "10px")
      .attr("font-weight", "600")
      .text((d) => d.name);

    // Phase boundary lines - using join()
    phasesGroup
      .selectAll<SVGLineElement, (typeof combatData.phases)[0]>("line.phase-boundary")
      .data(combatData.phases, (d) => d.id)
      .join("line")
      .attr("class", "phase-boundary")
      .attr("x1", (d) => x(d.start))
      .attr("x2", (d) => x(d.start))
      .attr("y1", 0)
      .attr("y2", totalHeight - tracks.phases.y)
      .attr("stroke", (d) => d.color)
      .attr("stroke-opacity", 0.5)
      .attr("stroke-dasharray", "4,2");
  }, [combatData.phases, tracks.phases, totalHeight, x, innerWidth]);

  // Render casts track
  useEffect(() => {
    const svg = svgRef.current;
    const container = containerRef.current;
    if (!svg || !container || !tracks.casts.visible || innerWidth <= 0) return;

    const g = select(svg).select<SVGGElement>("g.main-group");
    if (g.empty()) return;

    // Get or create casts group
    let castsGroup = g.select<SVGGElement>("g.casts-track");
    if (castsGroup.empty()) {
      castsGroup = g.append("g").attr("class", "casts-track");
    }
    castsGroup.attr("transform", `translate(0,${tracks.casts.y})`);

    // Row layout to avoid overlaps
    const rows: CastEvent[][] = [];
    combatData.casts.forEach((cast) => {
      const cx = x(cast.timestamp);
      let placed = false;
      for (const row of rows) {
        const lastInRow = row[row.length - 1];
        if (x(lastInRow.timestamp) + CAST_SIZE + 2 < cx) {
          row.push(cast);
          placed = true;
          break;
        }
      }
      if (!placed) rows.push([cast]);
    });

    // Flatten with row index
    const castsWithRow = rows.flatMap((row, rowIndex) =>
      row.map((cast) => ({ ...cast, rowIndex })),
    );

    // Cast groups - using modern join() pattern
    const castGroups = castsGroup
      .selectAll<SVGGElement, (typeof castsWithRow)[0]>("g.cast")
      .data(castsWithRow, (d) => d.id)
      .join(
        (enter) => {
          const g = enter
            .append("g")
            .attr("class", "cast")
            .attr("opacity", 0);

          g.append("rect").attr("class", "cast-bg");
          g.append("text").attr("class", "cast-label");

          g.transition().duration(200).attr("opacity", 1);
          return g;
        },
        (update) => update,
        (exit) => exit.transition().duration(150).attr("opacity", 0).remove(),
      );

    castGroups
      .attr("transform", (d) => {
        const cx = x(d.timestamp);
        const cy = d.rowIndex * (CAST_SIZE + 3) + 4;
        return `translate(${cx},${cy})`;
      })
      .attr("cursor", "pointer")
      .style("opacity", (d) =>
        selectedSpell !== null && selectedSpell !== d.spellId ? 0.3 : 1,
      );

    castGroups
      .select<SVGRectElement>("rect.cast-bg")
      .attr("width", CAST_SIZE)
      .attr("height", CAST_SIZE)
      .attr("rx", 4)
      .attr("fill", (d) => getSpell(d.spellId)?.color ?? "#888")
      .attr("stroke", (d) =>
        selectedSpell === d.spellId || hoveredSpell === d.spellId
          ? "#fff"
          : "transparent",
      )
      .attr("stroke-width", 2);

    castGroups
      .select<SVGTextElement>("text.cast-label")
      .attr("x", CAST_SIZE / 2)
      .attr("y", CAST_SIZE / 2 + 4)
      .attr("text-anchor", "middle")
      .attr("fill", "#fff")
      .attr("font-size", "9px")
      .attr("font-weight", "bold")
      .text((d) => {
        const spell = getSpell(d.spellId);
        if (!spell) return "";
        return spell.name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2);
      });

    // Event handlers
    castGroups
      .on("mouseenter", function (event, d) {
        setHoveredSpell(d.spellId);
        const spell = getSpell(d.spellId);
        if (!spell) return;
        const rect = (event.target as SVGElement).getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        throttledSetTooltip({
          x: rect.left - containerRect.left + CAST_SIZE / 2,
          y: rect.top - containerRect.top,
          content: (
            <div className="space-y-1">
              <div className="font-semibold" style={{ color: spell.color }}>
                {spell.name}
              </div>
              <div className="text-xs text-muted-foreground">
                Time: {formatTime(d.timestamp)}
              </div>
              {d.target && (
                <div className="text-xs text-muted-foreground">
                  Target: {d.target}
                </div>
              )}
            </div>
          ),
        });
      })
      .on("mouseleave", function () {
        setHoveredSpell(null);
        setTooltip(null);
      })
      .on("click", function (_, d) {
        setSelectedSpell((prev) => (prev === d.spellId ? null : d.spellId));
      });
  }, [
    combatData.casts,
    tracks.casts,
    x,
    innerWidth,
    selectedSpell,
    hoveredSpell,
    setHoveredSpell,
    setSelectedSpell,
    throttledSetTooltip,
  ]);

  // Render buffs track
  useEffect(() => {
    const svg = svgRef.current;
    const container = containerRef.current;
    if (!svg || !container || !tracks.buffs.visible || innerWidth <= 0) return;

    const g = select(svg).select<SVGGElement>("g.main-group");
    if (g.empty()) return;

    let buffsGroup = g.select<SVGGElement>("g.buffs-track");
    if (buffsGroup.empty()) {
      buffsGroup = g.append("g").attr("class", "buffs-track");
    }
    buffsGroup.attr("transform", `translate(0,${tracks.buffs.y})`);

    const BUFF_HEIGHT = 20;
    let rowIndex = 0;
    const allBuffs: Array<{
      buff: (typeof combatData.buffs)[0];
      rowIndex: number;
    }> = [];

    buffsBySpell.forEach((buffs) => {
      buffs.forEach((buff) => {
        allBuffs.push({ buff, rowIndex });
      });
      rowIndex++;
    });

    // Buff groups - using modern join() pattern
    const buffGroups = buffsGroup
      .selectAll<SVGGElement, (typeof allBuffs)[0]>("g.buff")
      .data(allBuffs, (d) => d.buff.id)
      .join(
        (enter) => {
          const g = enter
            .append("g")
            .attr("class", "buff")
            .attr("opacity", 0);

          g.append("rect").attr("class", "buff-bg");
          g.append("text").attr("class", "buff-label");
          g.append("circle").attr("class", "buff-stack-bg");
          g.append("text").attr("class", "buff-stack");

          g.transition().duration(250).attr("opacity", 1);
          return g;
        },
        (update) => update,
        (exit) => exit.transition().duration(200).attr("opacity", 0).remove(),
      );

    buffGroups.each(function (d) {
      const bx = x(d.buff.start);
      const bw = Math.max(4, x(d.buff.end) - x(d.buff.start));
      const by = d.rowIndex * (BUFF_HEIGHT + 3) + 2;
      const spell = getSpell(d.buff.spellId);
      const isDimmed =
        selectedSpell !== null && selectedSpell !== d.buff.spellId;

      const group = select(this)
        .attr("transform", `translate(${bx},${by})`)
        .style("opacity", isDimmed ? 0.3 : 1);

      group
        .select<SVGRectElement>("rect.buff-bg")
        .attr("width", bw)
        .attr("height", BUFF_HEIGHT)
        .attr("rx", 3)
        .attr("fill", spell?.color ?? "#888")
        .attr("opacity", 0.85);

      group
        .select<SVGTextElement>("text.buff-label")
        .attr("x", 6)
        .attr("y", BUFF_HEIGHT / 2 + 4)
        .attr("fill", "#fff")
        .attr("font-size", "10px")
        .attr("font-weight", "500")
        .text(bw > 60 ? (spell?.name ?? "") : "");

      // Stack indicator
      const hasStacks = d.buff.stacks && d.buff.stacks > 1;
      group
        .select<SVGCircleElement>("circle.buff-stack-bg")
        .attr("cx", bw - 8)
        .attr("cy", 8)
        .attr("r", hasStacks ? 6 : 0)
        .attr("fill", "#000")
        .attr("opacity", hasStacks ? 0.6 : 0);

      group
        .select<SVGTextElement>("text.buff-stack")
        .attr("x", bw - 8)
        .attr("y", 11)
        .attr("text-anchor", "middle")
        .attr("fill", "#fff")
        .attr("font-size", "9px")
        .attr("font-weight", "bold")
        .text(hasStacks ? d.buff.stacks! : "");
    });

    // Tooltip handlers
    buffGroups
      .on("mouseenter", function (event, d) {
        const spell = getSpell(d.buff.spellId);
        if (!spell) return;
        const bw = Math.max(4, x(d.buff.end) - x(d.buff.start));
        const rect = (event.target as SVGElement).getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        throttledSetTooltip({
          x: rect.left - containerRect.left + bw / 2,
          y: rect.top - containerRect.top,
          content: (
            <div className="space-y-1">
              <div className="font-semibold" style={{ color: spell.color }}>
                {spell.name}
              </div>
              <div className="text-xs text-muted-foreground">
                Duration: {formatTime(d.buff.start)} - {formatTime(d.buff.end)}
              </div>
              {d.buff.stacks && (
                <div className="text-xs text-muted-foreground">
                  Stacks: {d.buff.stacks}
                </div>
              )}
            </div>
          ),
        });
      })
      .on("mouseleave", () => setTooltip(null));
  }, [
    buffsBySpell,
    tracks.buffs,
    x,
    innerWidth,
    selectedSpell,
    throttledSetTooltip,
  ]);

  // Render debuffs track
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !tracks.debuffs.visible || innerWidth <= 0) return;

    const g = select(svg).select<SVGGElement>("g.main-group");
    if (g.empty()) return;

    let debuffsGroup = g.select<SVGGElement>("g.debuffs-track");
    if (debuffsGroup.empty()) {
      debuffsGroup = g.append("g").attr("class", "debuffs-track");
    }
    debuffsGroup.attr("transform", `translate(0,${tracks.debuffs.y})`);

    const DEBUFF_HEIGHT = 18;

    // Debuff rectangles - using modern join() pattern
    debuffsGroup
      .selectAll<SVGRectElement, (typeof debuffs)[0]>("rect.debuff")
      .data(debuffs, (d) => d.id)
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("class", "debuff")
            .attr("opacity", 0)
            .call((sel) => sel.transition().duration(200).attr("opacity", 0.7)),
        (update) => update,
        (exit) => exit.transition().duration(150).attr("opacity", 0).remove(),
      )
      .attr("x", (d) => x(d.start))
      .attr("y", (_, i) => (i % 2) * (DEBUFF_HEIGHT + 2) + 2)
      .attr("width", (d) => Math.max(4, x(d.end) - x(d.start)))
      .attr("height", DEBUFF_HEIGHT)
      .attr("rx", 3)
      .attr("fill", (d) => getSpell(d.spellId)?.color ?? "#888")
      .attr("stroke", (d) => getSpell(d.spellId)?.color ?? "#888")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,2");

    // Labels - using join()
    debuffsGroup
      .selectAll<SVGTextElement, (typeof debuffs)[0]>("text.debuff-label")
      .data(
        debuffs.filter((d) => x(d.end) - x(d.start) > 50),
        (d) => d.id,
      )
      .join(
        (enter) =>
          enter
            .append("text")
            .attr("class", "debuff-label")
            .attr("opacity", 0)
            .call((sel) => sel.transition().duration(200).attr("opacity", 1)),
        (update) => update,
        (exit) => exit.transition().duration(150).attr("opacity", 0).remove(),
      )
      .attr("x", (d) => x(d.start) + 6)
      .attr(
        "y",
        (_, i) => (i % 2) * (DEBUFF_HEIGHT + 2) + DEBUFF_HEIGHT / 2 + 6,
      )
      .attr("fill", "#fff")
      .attr("font-size", "9px")
      .text((d) => getSpell(d.spellId)?.name ?? "");
  }, [debuffs, tracks.debuffs, x, innerWidth]);

  // Render damage track
  useEffect(() => {
    const svg = svgRef.current;
    const container = containerRef.current;
    if (!svg || !container || !tracks.damage.visible || innerWidth <= 0) return;

    const g = select(svg).select<SVGGElement>("g.main-group");
    if (g.empty()) return;

    let damageGroup = g.select<SVGGElement>("g.damage-track");
    if (damageGroup.empty()) {
      damageGroup = g.append("g").attr("class", "damage-track");
    }
    damageGroup.attr("transform", `translate(0,${tracks.damage.y})`);

    // Damage groups - using modern join() pattern
    const damageGroups = damageGroup
      .selectAll<SVGGElement, (typeof combatData.damage)[0]>("g.damage-event")
      .data(combatData.damage, (d) => d.id)
      .join(
        (enter) => {
          const g = enter
            .append("g")
            .attr("class", "damage-event")
            .attr("opacity", 0);

          g.append("rect").attr("class", "damage-bar");
          g.append("circle").attr("class", "crit-indicator");

          g.transition().duration(200).attr("opacity", 1);
          return g;
        },
        (update) => update,
        (exit) => exit.transition().duration(150).attr("opacity", 0).remove(),
      );

    damageGroups.each(function (d) {
      const spell = getSpell(d.spellId);
      const dx = x(d.timestamp);
      const dy = damageY(d.amount);
      const dh = tracks.damage.height - 5 - dy;
      const isDimmed = selectedSpell !== null && selectedSpell !== d.spellId;

      const group = select(this).style("opacity", isDimmed ? 0.2 : 1);

      group
        .select<SVGRectElement>("rect.damage-bar")
        .attr("x", dx - 2)
        .attr("y", dy)
        .attr("width", 4)
        .attr("height", Math.max(0, dh))
        .attr("fill", spell?.color ?? "#888")
        .attr("rx", 1);

      group
        .select<SVGCircleElement>("circle.crit-indicator")
        .attr("cx", dx)
        .attr("cy", dy - 4)
        .attr("r", d.isCrit ? 3 : 0)
        .attr("fill", "#FFD700");
    });

    // Tooltip handlers
    damageGroups
      .on("mouseenter", function (event, d) {
        const spell = getSpell(d.spellId);
        if (!spell) return;
        const rect = (event.target as SVGElement).getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        throttledSetTooltip({
          x: rect.left - containerRect.left,
          y: rect.top - containerRect.top,
          content: (
            <div className="space-y-1">
              <div className="font-semibold" style={{ color: spell.color }}>
                {spell.name}
              </div>
              <div className="text-sm">
                {formatDamage(d.amount)}
                {d.isCrit && (
                  <span className="ml-1 text-yellow-400">CRIT!</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Target: {d.target}
              </div>
            </div>
          ),
        });
      })
      .on("mouseleave", () => setTooltip(null));
  }, [
    combatData.damage,
    tracks.damage,
    x,
    damageY,
    innerWidth,
    selectedSpell,
    throttledSetTooltip,
  ]);

  // Render resources track
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !tracks.resources.visible || innerWidth <= 0) return;

    const g = select(svg).select<SVGGElement>("g.main-group");
    if (g.empty()) return;

    let resourceGroup = g.select<SVGGElement>("g.resources-track");
    if (resourceGroup.empty()) {
      resourceGroup = g.append("g").attr("class", "resources-track");
    }
    resourceGroup.attr("transform", `translate(0,${tracks.resources.y})`);

    // Focus area
    let areaPath = resourceGroup.select<SVGPathElement>("path.focus-area");
    if (areaPath.empty()) {
      areaPath = resourceGroup.append("path").attr("class", "focus-area");
    }
    areaPath
      .datum(combatData.resources)
      .attr("d", focusArea)
      .attr("fill", "#3B82F6")
      .attr("opacity", 0.2);

    // Focus line
    let linePath = resourceGroup.select<SVGPathElement>("path.focus-line");
    if (linePath.empty()) {
      linePath = resourceGroup.append("path").attr("class", "focus-line");
    }
    linePath
      .datum(combatData.resources)
      .attr("d", focusLine)
      .attr("fill", "none")
      .attr("stroke", "#3B82F6")
      .attr("stroke-width", 2);

    // Threshold lines - using join()
    const thresholds = [30, 60, 90];
    resourceGroup
      .selectAll<SVGLineElement, number>("line.threshold")
      .data(thresholds)
      .join("line")
      .attr("class", "threshold")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", (d) => resourceY(d))
      .attr("y2", (d) => resourceY(d))
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-opacity", 0.3)
      .attr("stroke-dasharray", "2,4");
  }, [
    combatData.resources,
    tracks.resources,
    x,
    resourceY,
    focusArea,
    focusLine,
    innerWidth,
  ]);

  // Render track labels
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || innerWidth <= 0) return;

    const root = select(svg);

    let labelsGroup = root.select<SVGGElement>("g.track-labels");
    if (labelsGroup.empty()) {
      labelsGroup = root.append("g").attr("class", "track-labels");
    }
    labelsGroup.attr("transform", `translate(0,${MARGIN.top})`);

    const labelData = TRACK_CONFIGS.map((track) => ({
      ...track,
      layout: tracks[track.id],
    })).filter((t) => t.layout.visible || t.collapsible);

    // Track labels - using modern join() pattern
    const labelGroups = labelsGroup
      .selectAll<SVGGElement, (typeof labelData)[0]>("g.track-label")
      .data(labelData, (d) => d.id)
      .join(
        (enter) => {
          const g = enter.append("g").attr("class", "track-label");
          g.append("text").attr("class", "collapse-icon");
          g.append("text").attr("class", "label-text");
          return g;
        },
        (update) => update,
        (exit) => exit.remove(),
      );

    labelGroups.each(function (d) {
      const labelY = d.collapsible
        ? d.layout.y + (d.layout.visible ? d.layout.height / 2 : 10)
        : d.layout.y + d.layout.height / 2;

      const group = select(this)
        .attr("transform", `translate(8,${labelY})`)
        .attr("cursor", d.collapsible ? "pointer" : "default");

      group
        .select<SVGTextElement>("text.collapse-icon")
        .attr("x", 0)
        .attr("y", 4)
        .attr("fill", "hsl(var(--muted-foreground))")
        .attr("font-size", "10px")
        .text(d.collapsible ? (d.layout.visible ? "\u25BC" : "\u25B6") : "");

      group
        .select<SVGTextElement>("text.label-text")
        .attr("x", d.collapsible ? 14 : 0)
        .attr("y", 4)
        .attr("fill", "hsl(var(--foreground))")
        .attr("font-size", "11px")
        .attr("font-weight", "500")
        .text(d.label);
    });

    // Click handler for collapsible tracks
    labelGroups
      .filter((d) => d.collapsible)
      .on("click", (_, d) => toggleTrack(d.id));
  }, [tracks, innerWidth, toggleTrack]);

  // Render minimap with brush for navigation
  useEffect(() => {
    const minimap = minimapRef.current;
    const mainSvg = svgRef.current;
    if (!minimap || !mainSvg || innerWidth <= 0) return;

    const root = select(minimap);

    root
      .attr("width", innerWidth + MARGIN.left + MARGIN.right)
      .attr("height", MINIMAP_HEIGHT);

    let g = root.select<SVGGElement>("g.minimap-content");
    if (g.empty()) {
      g = root.append("g").attr("class", "minimap-content");
    }
    g.attr("transform", `translate(${MARGIN.left},5)`);

    const minimapX = x
      .copy()
      .domain([bounds.min, bounds.max])
      .range([0, innerWidth]);

    // Background
    let bg = g.select<SVGRectElement>("rect.minimap-bg");
    if (bg.empty()) {
      bg = g.append("rect").attr("class", "minimap-bg");
    }
    bg.attr("width", innerWidth)
      .attr("height", MINIMAP_HEIGHT - 10)
      .attr("fill", "hsl(var(--muted))")
      .attr("rx", 2);

    // Phases - using join()
    g.selectAll<SVGRectElement, (typeof combatData.phases)[0]>("rect.minimap-phase")
      .data(combatData.phases, (d) => d.id)
      .join("rect")
      .attr("class", "minimap-phase")
      .attr("x", (d) => minimapX(d.start))
      .attr("width", (d) => minimapX(d.end) - minimapX(d.start))
      .attr("height", MINIMAP_HEIGHT - 10)
      .attr("fill", (d) => d.color)
      .attr("opacity", 0.15);

    // Cast density - using join()
    const buckets = new Array(60).fill(0);
    combatData.casts.forEach((c) => {
      const bucket = Math.floor(c.timestamp);
      if (bucket >= 0 && bucket < 60) buckets[bucket]++;
    });
    const maxDensity = Math.max(...buckets, 1);

    g.selectAll<SVGRectElement, { count: number; i: number }>("rect.density")
      .data(
        buckets.map((count, i) => ({ count, i })).filter((d) => d.count > 0),
        (d) => d.i,
      )
      .join("rect")
      .attr("class", "density")
      .attr("x", (d) => minimapX(d.i))
      .attr("y", (d) => MINIMAP_HEIGHT - 10 - (d.count / maxDensity) * 20)
      .attr("width", Math.max(1, minimapX(1) - minimapX(0)))
      .attr("height", (d) => (d.count / maxDensity) * 20)
      .attr("fill", "hsl(var(--primary))")
      .attr("opacity", 0.4);

    // Brush for navigation
    let brushGroup = g.select<SVGGElement>("g.brush");
    if (brushGroup.empty()) {
      brushGroup = g.append("g").attr("class", "brush");
    }

    const brush = brushX<unknown>()
      .extent([
        [0, 0],
        [innerWidth, MINIMAP_HEIGHT - 10],
      ])
      .on("brush", (event: D3BrushEvent<unknown>) => {
        if (!event.selection || event.sourceEvent === undefined) return;
        const [x0, x1] = event.selection as [number, number];
        const newStart = minimapX.invert(x0);
        const newEnd = minimapX.invert(x1);
        setViewRange({ start: newStart, end: newEnd });
      });

    brushGroup.call(brush);

    // Set initial brush position based on current view range
    const brushSelection: [number, number] = [
      minimapX(viewRange.start),
      minimapX(viewRange.end),
    ];

    // Only move brush if it's significantly different (avoid feedback loop)
    brushGroup.call(brush.move, brushSelection);

    // Style the brush
    brushGroup.selectAll(".selection").attr("fill", "hsl(var(--primary))").attr("opacity", 0.25);

    brushGroup.selectAll(".handle").attr("fill", "hsl(var(--primary))");

    // Cleanup
    return () => {
      brushGroup.on(".brush", null);
    };
  }, [combatData.phases, combatData.casts, bounds, viewRange, innerWidth, x, setViewRange]);

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {formatTime(viewRange.start)} – {formatTime(viewRange.end)}
          <span className="ml-2 opacity-60">(Scroll to zoom, drag to pan)</span>
        </span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={zoomOut}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={resetZoom}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={zoomIn}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main timeline */}
      <div
        ref={containerRef}
        className="relative w-full rounded-lg border bg-background overflow-hidden"
      >
        <svg ref={svgRef} className="w-full" />
        <TimelineTooltip tooltip={tooltip} />
      </div>

      {/* Minimap */}
      <div className="rounded border bg-card overflow-hidden">
        <svg
          ref={minimapRef}
          className="w-full"
          style={{ height: MINIMAP_HEIGHT }}
        />
      </div>

      {/* Track toggles */}
      <div className="flex flex-wrap gap-2">
        {TRACK_CONFIGS.filter((t) => t.collapsible).map((track) => (
          <Button
            key={track.id}
            variant={expandedTracks.has(track.id) ? "secondary" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => toggleTrack(track.id)}
          >
            {expandedTracks.has(track.id) ? (
              <ChevronDown className="mr-1 h-3 w-3" />
            ) : (
              <ChevronRight className="mr-1 h-3 w-3" />
            )}
            {track.label}
          </Button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {uniqueSpells.map((spell) => (
          <button
            key={spell.id}
            className={cn(
              "flex items-center gap-1.5 rounded px-2 py-1 transition-opacity",
              selectedSpell === spell.id
                ? "bg-accent"
                : selectedSpell !== null
                  ? "opacity-40"
                  : "hover:bg-accent/50",
            )}
            onClick={() =>
              setSelectedSpell((prev) => (prev === spell.id ? null : spell.id))
            }
          >
            <div
              className="h-3 w-3 rounded"
              style={{ background: spell.color }}
            />
            <span className="text-muted-foreground">{spell.name}</span>
          </button>
        ))}
        {selectedSpell && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={() => setSelectedSpell(null)}
          >
            Clear filter
          </Button>
        )}
      </div>
    </div>
  );
}
