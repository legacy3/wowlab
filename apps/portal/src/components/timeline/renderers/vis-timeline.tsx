"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  combatSegments,
  trackGroups,
  timelineBounds,
  toDate,
  fromDate,
} from "../data";

function useVisStyles() {
  useEffect(() => {
    const id = "vis-timeline-css";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://cdn.jsdelivr.net/npm/vis-timeline@8.4.1/styles/vis-timeline-graph2d.min.css";
    document.head.appendChild(link);
  }, []);
}

export function VisTimelineRenderer() {
  useVisStyles();
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timelineRef = useRef<any>(null);
  const [range, setRange] = useState({ start: 0, end: 60 });

  useEffect(() => {
    let mounted = true;

    async function init() {
      const [{ Timeline }, { DataSet }] = await Promise.all([
        import("vis-timeline/standalone"),
        import("vis-data/standalone"),
      ]);

      if (!mounted || !containerRef.current || timelineRef.current) return;

      const groups = new DataSet(
        trackGroups.map((track, i) => ({
          id: track,
          content: `<div class="font-semibold text-sm px-2 py-1">${track}</div>`,
          order: i,
        })),
      );

      const items = new DataSet(
        combatSegments.map((seg) => ({
          id: seg.id,
          group: seg.track,
          content: `<div class="px-1 text-xs font-medium truncate">${seg.spellName}</div>`,
          start: toDate(seg.start),
          end: toDate(seg.end),
          style: `background:${seg.color};border-color:${seg.color};border-radius:4px;color:#fff;`,
          title: `${seg.spellName}\n${seg.start.toFixed(1)}s → ${seg.end.toFixed(1)}s`,
        })),
      );

      const timeline = new Timeline(containerRef.current, items, groups, {
        stack: true,
        orientation: { axis: "top", item: "top" },
        showCurrentTime: false,
        zoomMin: 2000,
        zoomMax: 120000,
        min: toDate(timelineBounds.min),
        max: toDate(timelineBounds.max),
        start: toDate(0),
        end: toDate(60),
        margin: { item: { horizontal: 2, vertical: 5 }, axis: 10 },
        moveable: true,
        zoomable: true,
        zoomKey: "ctrlKey",
        horizontalScroll: true,
        format: {
          minorLabels: { second: "s's'", minute: "m'm'" },
          majorLabels: { second: "m'm'", minute: "" },
        },
      });

      timeline.on("rangechanged", (p: { start: Date; end: Date }) => {
        setRange({ start: fromDate(p.start), end: fromDate(p.end) });
      });

      timelineRef.current = timeline;
    }

    init();
    return () => {
      mounted = false;
      timelineRef.current?.destroy();
      timelineRef.current = null;
    };
  }, []);

  const zoom = useCallback((factor: number) => {
    const tl = timelineRef.current;
    if (!tl) return;
    const w = tl.getWindow();
    const center = (w.start.getTime() + w.end.getTime()) / 2;
    const half = ((w.end.getTime() - w.start.getTime()) / 2) * factor;
    tl.setWindow(new Date(center - half), new Date(center + half), {
      animation: true,
    });
  }, []);

  const reset = useCallback(() => {
    timelineRef.current?.setWindow(toDate(0), toDate(60), { animation: true });
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {range.start.toFixed(1)}s – {range.end.toFixed(1)}s
          <span className="ml-2 opacity-60">(Ctrl+scroll to zoom)</span>
        </span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => zoom(2)}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={reset}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => zoom(0.5)}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="h-[500px] w-full rounded-lg border bg-card overflow-hidden
          [&_.vis-timeline]:border-0
          [&_.vis-panel.vis-background]:bg-transparent
          [&_.vis-panel.vis-center]:bg-transparent
          [&_.vis-labelset_.vis-label]:bg-muted/40
          [&_.vis-labelset_.vis-label]:border-border/40
          [&_.vis-foreground_.vis-group]:border-border/30
          [&_.vis-time-axis_.vis-text]:fill-muted-foreground
          [&_.vis-time-axis_.vis-text]:text-xs
          [&_.vis-time-axis_.vis-grid.vis-minor]:stroke-border/20
          [&_.vis-time-axis_.vis-grid.vis-major]:stroke-border/40"
      />

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
