"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import {
  scaleLinear,
  scaleBand,
  select,
  axisBottom,
  axisLeft,
  zoom,
  zoomIdentity,
  type D3ZoomEvent,
} from "d3";

import { Button } from "@/components/ui/button";
import {
  combatSegments,
  trackGroups,
  timelineBounds,
  type CombatSegment,
} from "../data";

const MARGIN = { top: 30, right: 20, bottom: 30, left: 100 };

export function D3TimelineRenderer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const zoomRef = useRef<any>(null);
  const [range, setRange] = useState({ start: 0, end: 60 });

  const draw = useCallback((transform?: { k: number; x: number }) => {
    const svg = svgRef.current;
    const container = containerRef.current;
    if (!svg || !container) return;

    const width = container.clientWidth;
    const height = 500;
    const innerWidth = width - MARGIN.left - MARGIN.right;
    const innerHeight = height - MARGIN.top - MARGIN.bottom;

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

    const y = scaleBand<string>()
      .domain(trackGroups)
      .range([0, innerHeight])
      .padding(0.2);

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
      .attr("height", innerHeight);

    // X axis
    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        axisBottom(x)
          .ticks(10)
          .tickFormat((d) => `${d}s`),
      )
      .selectAll("text")
      .attr("fill", "hsl(var(--muted-foreground))");

    g.selectAll(".x-axis path, .x-axis line").attr(
      "stroke",
      "hsl(var(--border))",
    );

    // Y axis
    g.append("g")
      .attr("class", "y-axis")
      .call(axisLeft(y))
      .selectAll("text")
      .attr("fill", "hsl(var(--muted-foreground))")
      .attr("font-weight", "600");

    g.selectAll(".y-axis path, .y-axis line").attr(
      "stroke",
      "hsl(var(--border))",
    );

    // Grid lines
    g.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(x.ticks(10))
      .join("line")
      .attr("x1", (d) => x(d))
      .attr("x2", (d) => x(d))
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-opacity", 0.3);

    // Segments
    const content = g.append("g").attr("clip-path", "url(#timeline-clip)");

    content
      .selectAll("rect.segment")
      .data(combatSegments)
      .join("rect")
      .attr("class", "segment")
      .attr("x", (d) => x(d.start))
      .attr("y", (d) => y(d.track)!)
      .attr("width", (d) => Math.max(2, x(d.end) - x(d.start)))
      .attr("height", y.bandwidth())
      .attr("rx", 4)
      .attr("fill", (d) => d.color)
      .attr("opacity", 0.9)
      .append("title")
      .text(
        (d) => `${d.spellName}\n${d.start.toFixed(1)}s → ${d.end.toFixed(1)}s`,
      );

    // Labels on segments (only if wide enough)
    content
      .selectAll("text.label")
      .data(combatSegments.filter((d) => x(d.end) - x(d.start) > 40))
      .join("text")
      .attr("class", "label")
      .attr("x", (d) => x(d.start) + 4)
      .attr("y", (d) => y(d.track)! + y.bandwidth() / 2 + 4)
      .attr("fill", "#fff")
      .attr("font-size", "11px")
      .attr("font-weight", "500")
      .text((d) => d.spellName);

    // Update range display
    const domain = x.domain();
    setRange({ start: domain[0], end: domain[1] });
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    const container = containerRef.current;
    if (!svg || !container) return;

    const width = container.clientWidth;
    const innerWidth = width - MARGIN.left - MARGIN.right;

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 20])
      .translateExtent([
        [0, 0],
        [innerWidth, 500],
      ])
      .extent([
        [0, 0],
        [innerWidth, 500],
      ])
      .on("zoom", (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
        draw({ k: event.transform.k, x: event.transform.x });
      });

    select(svg).call(zoomBehavior);
    zoomRef.current = zoomBehavior;

    draw();

    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {range.start.toFixed(1)}s – {range.end.toFixed(1)}s
          <span className="ml-2 opacity-60">(Scroll to zoom, drag to pan)</span>
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

      <div
        ref={containerRef}
        className="w-full rounded-lg border bg-card overflow-hidden"
      >
        <svg ref={svgRef} className="w-full" style={{ height: 500 }} />
      </div>

      <div className="flex flex-wrap gap-4 text-xs">
        {Array.from(new Set(combatSegments.map((s) => s.spellId))).map((id) => {
          const seg = combatSegments.find((s) => s.spellId === id)!;
          return (
            <div key={id} className="flex items-center gap-1.5">
              <div
                className="h-3 w-3 rounded"
                style={{ background: seg.color }}
              />
              <span className="text-muted-foreground">{seg.spellName}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
