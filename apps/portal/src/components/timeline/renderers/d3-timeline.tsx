"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  scaleLinear,
  scaleBand,
  select,
  axisBottom,
  zoom,
  zoomIdentity,
  line,
  curveMonotoneX,
  area,
  type D3ZoomEvent,
  type Selection,
} from "d3";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  combatData,
  spells,
  timelineBounds,
  formatDamage,
  formatTime,
  type CastEvent,
  type BuffEvent,
  type DamageEvent,
} from "../data";

// Track configuration
interface TrackConfig {
  id: string;
  label: string;
  height: number;
  collapsible: boolean;
  defaultExpanded: boolean;
}

const TRACKS: TrackConfig[] = [
  {
    id: "phases",
    label: "Phases",
    height: 24,
    collapsible: false,
    defaultExpanded: true,
  },
  {
    id: "casts",
    label: "Casts",
    height: 60,
    collapsible: true,
    defaultExpanded: true,
  },
  {
    id: "buffs",
    label: "Buffs",
    height: 80,
    collapsible: true,
    defaultExpanded: true,
  },
  {
    id: "debuffs",
    label: "Debuffs",
    height: 40,
    collapsible: true,
    defaultExpanded: true,
  },
  {
    id: "damage",
    label: "Damage",
    height: 80,
    collapsible: true,
    defaultExpanded: true,
  },
  {
    id: "resources",
    label: "Focus",
    height: 50,
    collapsible: true,
    defaultExpanded: true,
  },
];

const MARGIN = { top: 10, right: 20, bottom: 30, left: 90 };
const MINIMAP_HEIGHT = 40;
const GAP = 4;

// Tooltip state
interface TooltipState {
  x: number;
  y: number;
  content: React.ReactNode;
}

export function D3TimelineRenderer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const minimapRef = useRef<SVGSVGElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const zoomRef = useRef<any>(null);
  const [range, setRange] = useState({ start: 0, end: 60 });
  const [expandedTracks, setExpandedTracks] = useState<Set<string>>(
    new Set(TRACKS.filter((t) => t.defaultExpanded).map((t) => t.id)),
  );
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [selectedSpell, setSelectedSpell] = useState<number | null>(null);
  const [hoveredSpell, setHoveredSpell] = useState<number | null>(null);

  // Calculate visible tracks and their y positions
  const trackLayout = useMemo(() => {
    let y = 0;
    const layout: Record<
      string,
      { y: number; height: number; visible: boolean }
    > = {};

    for (const track of TRACKS) {
      const visible = !track.collapsible || expandedTracks.has(track.id);
      const height = visible ? track.height : 0;
      layout[track.id] = { y, height, visible };
      y += height + (visible ? GAP : 0);
    }

    return { tracks: layout, totalHeight: y };
  }, [expandedTracks]);

  // Group buffs by spell to stack them
  const buffsBySpell = useMemo(() => {
    const playerBuffs = combatData.buffs.filter(
      (b) => b.type === "buff" && b.target === "Player",
    );
    const grouped = new Map<number, BuffEvent[]>();
    for (const buff of playerBuffs) {
      const existing = grouped.get(buff.spellId) ?? [];
      grouped.set(buff.spellId, [...existing, buff]);
    }
    return grouped;
  }, []);

  const debuffs = useMemo(
    () => combatData.buffs.filter((b) => b.type === "debuff"),
    [],
  );

  const draw = useCallback(
    (transform?: { k: number; x: number }) => {
      const svg = svgRef.current;
      const container = containerRef.current;
      if (!svg || !container) return;

      const width = container.clientWidth;
      const height = trackLayout.totalHeight + MARGIN.top + MARGIN.bottom;
      const innerWidth = width - MARGIN.left - MARGIN.right;

      // X scale
      const xBase = scaleLinear()
        .domain([timelineBounds.min, timelineBounds.max])
        .range([0, innerWidth]);

      const x = transform
        ? xBase
            .copy()
            .domain([
              xBase.invert(-transform.x / transform.k),
              xBase.invert((innerWidth - transform.x) / transform.k),
            ])
        : xBase;

      const root = select(svg);
      root.selectAll("*").remove();

      root
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`);

      const g = root
        .append("g")
        .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

      // Clip path
      g.append("defs")
        .append("clipPath")
        .attr("id", "timeline-clip")
        .append("rect")
        .attr("width", innerWidth)
        .attr("height", trackLayout.totalHeight);

      // Background
      g.append("rect")
        .attr("width", innerWidth)
        .attr("height", trackLayout.totalHeight)
        .attr("fill", "hsl(var(--card))")
        .attr("rx", 4);

      // Grid lines
      const gridGroup = g.append("g").attr("class", "grid");
      x.ticks(20).forEach((tick) => {
        gridGroup
          .append("line")
          .attr("x1", x(tick))
          .attr("x2", x(tick))
          .attr("y1", 0)
          .attr("y2", trackLayout.totalHeight)
          .attr("stroke", "hsl(var(--border))")
          .attr("stroke-opacity", tick % 10 === 0 ? 0.4 : 0.15)
          .attr("stroke-dasharray", tick % 10 === 0 ? "none" : "2,2");
      });

      const content = g.append("g").attr("clip-path", "url(#timeline-clip)");

      // === PHASES TRACK ===
      if (trackLayout.tracks.phases.visible) {
        const phaseGroup = content
          .append("g")
          .attr("transform", `translate(0,${trackLayout.tracks.phases.y})`);

        combatData.phases.forEach((phase) => {
          const px = x(phase.start);
          const pw = x(phase.end) - x(phase.start);
          if (pw < 0) return;

          phaseGroup
            .append("rect")
            .attr("x", px)
            .attr("y", 2)
            .attr("width", pw)
            .attr("height", trackLayout.tracks.phases.height - 4)
            .attr("fill", phase.color)
            .attr("opacity", 0.2)
            .attr("rx", 2);

          if (pw > 50) {
            phaseGroup
              .append("text")
              .attr("x", px + pw / 2)
              .attr("y", trackLayout.tracks.phases.height / 2 + 4)
              .attr("text-anchor", "middle")
              .attr("fill", phase.color)
              .attr("font-size", "10px")
              .attr("font-weight", "600")
              .text(phase.name);
          }

          // Phase boundary line
          phaseGroup
            .append("line")
            .attr("x1", px)
            .attr("x2", px)
            .attr("y1", 0)
            .attr("y2", trackLayout.totalHeight - trackLayout.tracks.phases.y)
            .attr("stroke", phase.color)
            .attr("stroke-opacity", 0.5)
            .attr("stroke-dasharray", "4,2");
        });
      }

      // === CASTS TRACK ===
      if (trackLayout.tracks.casts.visible) {
        const castsGroup = content
          .append("g")
          .attr("transform", `translate(0,${trackLayout.tracks.casts.y})`);

        // Group casts by approximate position to avoid overlap
        const castWidth = 24;
        const castHeight = 24;
        const rows: CastEvent[][] = [];

        combatData.casts.forEach((cast) => {
          const cx = x(cast.timestamp);
          let placed = false;

          for (const row of rows) {
            const lastInRow = row[row.length - 1];
            if (x(lastInRow.timestamp) + castWidth + 2 < cx) {
              row.push(cast);
              placed = true;
              break;
            }
          }

          if (!placed) {
            rows.push([cast]);
          }
        });

        rows.forEach((row, rowIndex) => {
          row.forEach((cast) => {
            const spell = spells[cast.spellId];
            if (!spell) return;

            const cx = x(cast.timestamp);
            const cy = rowIndex * (castHeight + 3) + 4;

            const isSelected = selectedSpell === cast.spellId;
            const isHovered = hoveredSpell === cast.spellId;
            const isDimmed =
              selectedSpell !== null && selectedSpell !== cast.spellId;

            const castG = castsGroup
              .append("g")
              .attr("transform", `translate(${cx},${cy})`)
              .attr("cursor", "pointer")
              .style("opacity", isDimmed ? 0.3 : 1);

            // Background
            castG
              .append("rect")
              .attr("width", castWidth)
              .attr("height", castHeight)
              .attr("rx", 4)
              .attr("fill", spell.color)
              .attr("stroke", isSelected || isHovered ? "#fff" : "transparent")
              .attr("stroke-width", 2);

            // Abbreviated spell name
            const abbrev =
              spell.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2) || spell.name.slice(0, 2);

            castG
              .append("text")
              .attr("x", castWidth / 2)
              .attr("y", castHeight / 2 + 4)
              .attr("text-anchor", "middle")
              .attr("fill", "#fff")
              .attr("font-size", "9px")
              .attr("font-weight", "bold")
              .text(abbrev);

            // Interaction handlers
            castG
              .on("mouseenter", function (event) {
                setHoveredSpell(cast.spellId);
                const rect = (
                  event.target as SVGElement
                ).getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                setTooltip({
                  x: rect.left - containerRect.left + castWidth / 2,
                  y: rect.top - containerRect.top,
                  content: (
                    <div className="space-y-1">
                      <div
                        className="font-semibold"
                        style={{ color: spell.color }}
                      >
                        {spell.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Time: {formatTime(cast.timestamp)}
                      </div>
                      {cast.target && (
                        <div className="text-xs text-muted-foreground">
                          Target: {cast.target}
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
              .on("click", function () {
                setSelectedSpell((prev) =>
                  prev === cast.spellId ? null : cast.spellId,
                );
              });
          });
        });
      }

      // === BUFFS TRACK ===
      if (trackLayout.tracks.buffs.visible) {
        const buffsGroup = content
          .append("g")
          .attr("transform", `translate(0,${trackLayout.tracks.buffs.y})`);

        let rowIndex = 0;
        const buffHeight = 20;

        buffsBySpell.forEach((buffs, spellId) => {
          const spell = spells[spellId];
          if (!spell) return;

          buffs.forEach((buff) => {
            const bx = x(buff.start);
            const bw = Math.max(4, x(buff.end) - x(buff.start));
            const by = rowIndex * (buffHeight + 3) + 2;

            const isDimmed =
              selectedSpell !== null && selectedSpell !== buff.spellId;

            const buffG = buffsGroup
              .append("g")
              .attr("transform", `translate(${bx},${by})`)
              .style("opacity", isDimmed ? 0.3 : 1);

            buffG
              .append("rect")
              .attr("width", bw)
              .attr("height", buffHeight)
              .attr("rx", 3)
              .attr("fill", spell.color)
              .attr("opacity", 0.85);

            // Show name if wide enough
            if (bw > 60) {
              buffG
                .append("text")
                .attr("x", 6)
                .attr("y", buffHeight / 2 + 4)
                .attr("fill", "#fff")
                .attr("font-size", "10px")
                .attr("font-weight", "500")
                .text(spell.name);
            }

            // Stack indicator
            if (buff.stacks && buff.stacks > 1) {
              buffG
                .append("circle")
                .attr("cx", bw - 8)
                .attr("cy", 8)
                .attr("r", 6)
                .attr("fill", "#000")
                .attr("opacity", 0.6);

              buffG
                .append("text")
                .attr("x", bw - 8)
                .attr("y", 11)
                .attr("text-anchor", "middle")
                .attr("fill", "#fff")
                .attr("font-size", "9px")
                .attr("font-weight", "bold")
                .text(buff.stacks);
            }

            // Tooltip
            buffG
              .on("mouseenter", function (event) {
                const rect = (
                  event.target as SVGElement
                ).getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                setTooltip({
                  x: rect.left - containerRect.left + bw / 2,
                  y: rect.top - containerRect.top,
                  content: (
                    <div className="space-y-1">
                      <div
                        className="font-semibold"
                        style={{ color: spell.color }}
                      >
                        {spell.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Duration: {formatTime(buff.start)} -{" "}
                        {formatTime(buff.end)}
                      </div>
                      {buff.stacks && (
                        <div className="text-xs text-muted-foreground">
                          Stacks: {buff.stacks}
                        </div>
                      )}
                    </div>
                  ),
                });
              })
              .on("mouseleave", () => setTooltip(null));
          });

          rowIndex++;
        });
      }

      // === DEBUFFS TRACK ===
      if (trackLayout.tracks.debuffs.visible) {
        const debuffsGroup = content
          .append("g")
          .attr("transform", `translate(0,${trackLayout.tracks.debuffs.y})`);

        const debuffHeight = 18;

        debuffs.forEach((debuff, i) => {
          const spell = spells[debuff.spellId];
          if (!spell) return;

          const dx = x(debuff.start);
          const dw = Math.max(4, x(debuff.end) - x(debuff.start));

          debuffsGroup
            .append("rect")
            .attr("x", dx)
            .attr("y", (i % 2) * (debuffHeight + 2) + 2)
            .attr("width", dw)
            .attr("height", debuffHeight)
            .attr("rx", 3)
            .attr("fill", spell.color)
            .attr("opacity", 0.7)
            .attr("stroke", spell.color)
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "3,2");

          if (dw > 50) {
            debuffsGroup
              .append("text")
              .attr("x", dx + 6)
              .attr("y", (i % 2) * (debuffHeight + 2) + debuffHeight / 2 + 6)
              .attr("fill", "#fff")
              .attr("font-size", "9px")
              .text(spell.name);
          }
        });
      }

      // === DAMAGE TRACK ===
      if (trackLayout.tracks.damage.visible) {
        const damageGroup = content
          .append("g")
          .attr("transform", `translate(0,${trackLayout.tracks.damage.y})`);

        const maxDamage = Math.max(...combatData.damage.map((d) => d.amount));
        const damageY = scaleLinear()
          .domain([0, maxDamage])
          .range([trackLayout.tracks.damage.height - 5, 5]);

        // Damage bars
        combatData.damage.forEach((dmg) => {
          const spell = spells[dmg.spellId];
          if (!spell) return;

          const dx = x(dmg.timestamp);
          const dy = damageY(dmg.amount);
          const dh = trackLayout.tracks.damage.height - 5 - dy;

          const isDimmed =
            selectedSpell !== null && selectedSpell !== dmg.spellId;

          const dmgG = damageGroup
            .append("g")
            .style("opacity", isDimmed ? 0.2 : 1);

          // Bar
          dmgG
            .append("rect")
            .attr("x", dx - 2)
            .attr("y", dy)
            .attr("width", 4)
            .attr("height", dh)
            .attr("fill", spell.color)
            .attr("rx", 1);

          // Crit indicator
          if (dmg.isCrit) {
            dmgG
              .append("circle")
              .attr("cx", dx)
              .attr("cy", dy - 4)
              .attr("r", 3)
              .attr("fill", "#FFD700");
          }

          // Tooltip
          dmgG
            .on("mouseenter", function (event) {
              const rect = (event.target as SVGElement).getBoundingClientRect();
              const containerRect = container.getBoundingClientRect();
              setTooltip({
                x: rect.left - containerRect.left,
                y: rect.top - containerRect.top,
                content: (
                  <div className="space-y-1">
                    <div
                      className="font-semibold"
                      style={{ color: spell.color }}
                    >
                      {spell.name}
                    </div>
                    <div className="text-sm">
                      {formatDamage(dmg.amount)}
                      {dmg.isCrit && (
                        <span className="ml-1 text-yellow-400">CRIT!</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Target: {dmg.target}
                    </div>
                  </div>
                ),
              });
            })
            .on("mouseleave", () => setTooltip(null));
        });
      }

      // === RESOURCES TRACK ===
      if (trackLayout.tracks.resources.visible) {
        const resourceGroup = content
          .append("g")
          .attr("transform", `translate(0,${trackLayout.tracks.resources.y})`);

        const resourceY = scaleLinear()
          .domain([0, 120])
          .range([trackLayout.tracks.resources.height - 5, 5]);

        // Focus area
        const focusArea = area<{ timestamp: number; focus: number }>()
          .x((d) => x(d.timestamp))
          .y0(trackLayout.tracks.resources.height - 5)
          .y1((d) => resourceY(d.focus))
          .curve(curveMonotoneX);

        const focusLine = line<{ timestamp: number; focus: number }>()
          .x((d) => x(d.timestamp))
          .y((d) => resourceY(d.focus))
          .curve(curveMonotoneX);

        resourceGroup
          .append("path")
          .datum(combatData.resources)
          .attr("d", focusArea)
          .attr("fill", "#3B82F6")
          .attr("opacity", 0.2);

        resourceGroup
          .append("path")
          .datum(combatData.resources)
          .attr("d", focusLine)
          .attr("fill", "none")
          .attr("stroke", "#3B82F6")
          .attr("stroke-width", 2);

        // Resource thresholds
        [30, 60, 90].forEach((threshold) => {
          resourceGroup
            .append("line")
            .attr("x1", 0)
            .attr("x2", innerWidth)
            .attr("y1", resourceY(threshold))
            .attr("y2", resourceY(threshold))
            .attr("stroke", "hsl(var(--border))")
            .attr("stroke-opacity", 0.3)
            .attr("stroke-dasharray", "2,4");
        });
      }

      // === X AXIS ===
      g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${trackLayout.totalHeight})`)
        .call(
          axisBottom(x)
            .ticks(10)
            .tickFormat((d) => formatTime(d as number)),
        )
        .selectAll("text")
        .attr("fill", "hsl(var(--muted-foreground))")
        .attr("font-size", "11px");

      g.selectAll(".x-axis path, .x-axis line").attr(
        "stroke",
        "hsl(var(--border))",
      );

      // === TRACK LABELS ===
      const labelsGroup = root
        .append("g")
        .attr("transform", `translate(0,${MARGIN.top})`);

      TRACKS.forEach((track) => {
        const layout = trackLayout.tracks[track.id];
        if (!layout.visible && !track.collapsible) return;

        const labelY = track.collapsible
          ? layout.y + (layout.visible ? layout.height / 2 : 10)
          : layout.y + layout.height / 2;

        const labelGroup = labelsGroup
          .append("g")
          .attr("transform", `translate(8,${labelY})`)
          .attr("cursor", track.collapsible ? "pointer" : "default");

        if (track.collapsible) {
          labelGroup
            .append("text")
            .attr("x", 0)
            .attr("y", 4)
            .attr("fill", "hsl(var(--muted-foreground))")
            .attr("font-size", "10px")
            .text(layout.visible ? "▼" : "▶");
        }

        labelGroup
          .append("text")
          .attr("x", track.collapsible ? 14 : 0)
          .attr("y", 4)
          .attr("fill", "hsl(var(--foreground))")
          .attr("font-size", "11px")
          .attr("font-weight", "500")
          .text(track.label);
      });

      // Update range display
      const domain = x.domain();
      setRange({ start: domain[0], end: domain[1] });
    },
    [trackLayout, buffsBySpell, debuffs, selectedSpell, hoveredSpell],
  );

  // Draw minimap
  const drawMinimap = useCallback(() => {
    const minimap = minimapRef.current;
    const container = containerRef.current;
    if (!minimap || !container) return;

    const width = container.clientWidth - MARGIN.left - MARGIN.right;

    const root = select(minimap);
    root.selectAll("*").remove();

    root
      .attr("width", width + MARGIN.left + MARGIN.right)
      .attr("height", MINIMAP_HEIGHT);

    const g = root.append("g").attr("transform", `translate(${MARGIN.left},5)`);

    const x = scaleLinear()
      .domain([timelineBounds.min, timelineBounds.max])
      .range([0, width]);

    // Background
    g.append("rect")
      .attr("width", width)
      .attr("height", MINIMAP_HEIGHT - 10)
      .attr("fill", "hsl(var(--muted))")
      .attr("rx", 2);

    // Phases
    combatData.phases.forEach((phase) => {
      g.append("rect")
        .attr("x", x(phase.start))
        .attr("width", x(phase.end) - x(phase.start))
        .attr("height", MINIMAP_HEIGHT - 10)
        .attr("fill", phase.color)
        .attr("opacity", 0.15);
    });

    // Cast density
    const buckets = new Array(60).fill(0);
    combatData.casts.forEach((c) => {
      const bucket = Math.floor(c.timestamp);
      if (bucket >= 0 && bucket < 60) buckets[bucket]++;
    });
    const maxDensity = Math.max(...buckets);

    buckets.forEach((count, i) => {
      if (count > 0) {
        g.append("rect")
          .attr("x", x(i))
          .attr("y", MINIMAP_HEIGHT - 10 - (count / maxDensity) * 20)
          .attr("width", x(1) - x(0))
          .attr("height", (count / maxDensity) * 20)
          .attr("fill", "hsl(var(--primary))")
          .attr("opacity", 0.4);
      }
    });

    // Viewport indicator
    const viewportX = x(range.start);
    const viewportW = x(range.end) - x(range.start);

    g.append("rect")
      .attr("x", viewportX)
      .attr("width", viewportW)
      .attr("height", MINIMAP_HEIGHT - 10)
      .attr("fill", "hsl(var(--primary))")
      .attr("opacity", 0.2)
      .attr("stroke", "hsl(var(--primary))")
      .attr("stroke-width", 1)
      .attr("rx", 2);
  }, [range]);

  useEffect(() => {
    const svg = svgRef.current;
    const container = containerRef.current;
    if (!svg || !container) return;

    const width = container.clientWidth;
    const innerWidth = width - MARGIN.left - MARGIN.right;

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 30])
      .translateExtent([
        [0, 0],
        [innerWidth, trackLayout.totalHeight],
      ])
      .extent([
        [0, 0],
        [innerWidth, trackLayout.totalHeight],
      ])
      .on("zoom", (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
        draw({ k: event.transform.k, x: event.transform.x });
      });

    select(svg).call(zoomBehavior);
    zoomRef.current = zoomBehavior;

    draw();
    drawMinimap();

    const handleResize = () => {
      draw();
      drawMinimap();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw, drawMinimap, trackLayout.totalHeight]);

  useEffect(() => {
    drawMinimap();
  }, [range, drawMinimap]);

  const zoomBy = useCallback((factor: number) => {
    const svg = svgRef.current;
    if (!svg || !zoomRef.current) return;
    select(svg)
      .transition()
      .duration(200)
      .call(zoomRef.current.scaleBy, factor);
  }, []);

  const resetZoom = useCallback(() => {
    const svg = svgRef.current;
    if (!svg || !zoomRef.current) return;
    select(svg)
      .transition()
      .duration(300)
      .call(zoomRef.current.transform, zoomIdentity);
  }, []);

  const toggleTrack = useCallback((trackId: string) => {
    setExpandedTracks((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
  }, []);

  // Unique spells for legend
  const uniqueSpells = useMemo(() => {
    const seen = new Set<number>();
    return combatData.casts
      .filter((c) => {
        if (seen.has(c.spellId)) return false;
        seen.add(c.spellId);
        return true;
      })
      .map((c) => spells[c.spellId])
      .filter(Boolean);
  }, []);

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {formatTime(range.start)} – {formatTime(range.end)}
            <span className="ml-2 opacity-60">
              (Scroll to zoom, drag to pan)
            </span>
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => zoomBy(0.5)}
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
              onClick={() => zoomBy(2)}
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

          {/* Tooltip */}
          {tooltip && (
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
          )}
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
          {TRACKS.filter((t) => t.collapsible).map((track) => (
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
                setSelectedSpell((prev) =>
                  prev === spell.id ? null : spell.id,
                )
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
    </TooltipProvider>
  );
}
