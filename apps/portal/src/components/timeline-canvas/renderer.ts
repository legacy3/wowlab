import * as fabric from "fabric";

import { batchAdd, staticLine, staticRect, staticText } from "@/components/fabric";

import type { TimelineData, TimelineRenderOptions } from "./types";

import {
  COLORS,
  EVENT_CORNER_RADIUS,
  EVENT_PADDING,
  HEADER_WIDTH,
  PIXELS_PER_SECOND,
  TIME_HEADER_HEIGHT,
  TRACK_GAP,
  TRACK_HEIGHT,
} from "./constants";

// Use accent for playhead
const PLAYHEAD_COLOR = COLORS.accent;
const PLAYHEAD_GLOW = COLORS.accentGlow;

// =============================================================================
// Main Renderer
// =============================================================================

export function renderTimeline(
  canvas: fabric.Canvas,
  data: TimelineData,
  options: TimelineRenderOptions = {},
): void {
  const { duration, events, tracks } = data;
  const { onEventClick, onEventHover, playheadPosition = 0 } = options;

  const canvasWidth = canvas.width ?? 800;
  const canvasHeight = canvas.height ?? 600;
  const contentHeight = tracks.length * (TRACK_HEIGHT + TRACK_GAP);
  const timelineWidth = (duration / 1000) * PIXELS_PER_SECOND;

  const staticObjects: fabric.FabricObject[] = [];

  // ==========================================================================
  // Full Background
  // ==========================================================================

  staticObjects.push(
    staticRect({
      fill: COLORS.bg,
      height: canvasHeight,
      left: 0,
      top: 0,
      width: canvasWidth,
    }),
  );

  // ==========================================================================
  // Track Backgrounds (in content area only)
  // ==========================================================================

  tracks.forEach((_, i) => {
    const y = TIME_HEADER_HEIGHT + i * (TRACK_HEIGHT + TRACK_GAP);
    staticObjects.push(
      staticRect({
        fill: i % 2 === 0 ? COLORS.trackBg : COLORS.trackBgAlt,
        height: TRACK_HEIGHT,
        left: HEADER_WIDTH,
        top: y,
        width: Math.max(timelineWidth, canvasWidth - HEADER_WIDTH),
      }),
    );
  });

  // ==========================================================================
  // Grid Lines (in content area only)
  // ==========================================================================

  const seconds = Math.ceil(duration / 1000);

  for (let s = 0; s <= seconds; s++) {
    const x = HEADER_WIDTH + s * PIXELS_PER_SECOND;
    const isMajor = s % 5 === 0;

    // Vertical grid line in content area
    staticObjects.push(
      staticLine([x, TIME_HEADER_HEIGHT, x, TIME_HEADER_HEIGHT + contentHeight], {
        stroke: isMajor ? COLORS.gridLineMajor : COLORS.gridLine,
        strokeWidth: 1,
      }),
    );

    // Tick mark in time header
    const tickHeight = isMajor ? 8 : 4;
    staticObjects.push(
      staticLine([x, TIME_HEADER_HEIGHT - tickHeight, x, TIME_HEADER_HEIGHT], {
        stroke: COLORS.tickMark,
        strokeWidth: 1,
      }),
    );

    // Time label (every 5 seconds)
    if (isMajor) {
      staticObjects.push(
        staticText(formatTime(s), {
          fill: COLORS.text,
          fontFamily: "system-ui, sans-serif",
          fontSize: 11,
          left: x,
          originX: "center",
          top: 8,
        }),
      );
    }
  }

  // ==========================================================================
  // Header Area (drawn on top of grid)
  // ==========================================================================

  // Time header background
  staticObjects.push(
    staticRect({
      fill: COLORS.headerBg,
      height: TIME_HEADER_HEIGHT,
      left: 0,
      top: 0,
      width: HEADER_WIDTH,
    }),
  );

  // Track labels background
  staticObjects.push(
    staticRect({
      fill: COLORS.headerBg,
      height: contentHeight,
      left: 0,
      top: TIME_HEADER_HEIGHT,
      width: HEADER_WIDTH,
    }),
  );

  // Track labels
  tracks.forEach((name, i) => {
    const y = TIME_HEADER_HEIGHT + i * (TRACK_HEIGHT + TRACK_GAP);
    staticObjects.push(
      staticText(name, {
        fill: COLORS.text,
        fontFamily: "system-ui, sans-serif",
        fontSize: 12,
        left: 16,
        originY: "center",
        top: y + TRACK_HEIGHT / 2,
      }),
    );
  });

  // ==========================================================================
  // Borders
  // ==========================================================================

  // Header bottom border
  staticObjects.push(
    staticLine([0, TIME_HEADER_HEIGHT, canvasWidth, TIME_HEADER_HEIGHT], {
      stroke: COLORS.border,
      strokeWidth: 1,
    }),
  );

  // Label column right border
  staticObjects.push(
    staticLine([HEADER_WIDTH, 0, HEADER_WIDTH, TIME_HEADER_HEIGHT + contentHeight], {
      stroke: COLORS.border,
      strokeWidth: 1,
    }),
  );

  // Track borders
  tracks.forEach((_, i) => {
    const y = TIME_HEADER_HEIGHT + (i + 1) * (TRACK_HEIGHT + TRACK_GAP) - TRACK_GAP;
    staticObjects.push(
      staticLine([HEADER_WIDTH, y, canvasWidth, y], {
        stroke: COLORS.border,
        strokeWidth: 1,
      }),
    );
  });

  // Add all static objects
  batchAdd(canvas, staticObjects);

  // ==========================================================================
  // Events (interactive, positioned in content area)
  // ==========================================================================

  events.forEach((event) => {
    const x = HEADER_WIDTH + (event.startTime / 1000) * PIXELS_PER_SECOND;
    const y = TIME_HEADER_HEIGHT + event.track * (TRACK_HEIGHT + TRACK_GAP) + EVENT_PADDING;
    const width = Math.max((event.duration / 1000) * PIXELS_PER_SECOND, 12);
    const height = TRACK_HEIGHT - EVENT_PADDING * 2;

    const eventObjects: fabric.FabricObject[] = [];

    // Event bar
    const bar = new fabric.Rect({
      fill: event.color,
      height,
      rx: EVENT_CORNER_RADIUS,
      ry: EVENT_CORNER_RADIUS,
      width,
    });
    eventObjects.push(bar);

    // Event label (if wide enough)
    if (width > 70) {
      const label = new fabric.Text(event.name, {
        fill: "#ffffff",
        fontFamily: "system-ui, sans-serif",
        fontSize: 11,
        fontWeight: "600",
        left: 8,
        originY: "center",
        top: height / 2,
      });
      eventObjects.push(label);
    }

    const group = new fabric.Group(eventObjects, {
      hasBorders: false,
      hasControls: false,
      hoverCursor: "pointer",
      left: x,
      objectCaching: true,
      selectable: false,
      top: y,
    });

    if (onEventHover) {
      group.on("mouseover", (e) => {
        const pointer = e.viewportPoint;
        if (!pointer) return;
        onEventHover({ event, screenX: pointer.x, screenY: pointer.y });
      });
      group.on("mouseout", () => onEventHover(null));
    }

    if (onEventClick) {
      group.on("mouseup", () => onEventClick(event));
    }

    canvas.add(group);
  });

  // ==========================================================================
  // Playhead (in content area only)
  // ==========================================================================

  const playheadX = HEADER_WIDTH + (playheadPosition / 1000) * PIXELS_PER_SECOND;

  // Glow
  canvas.add(
    new fabric.Line(
      [playheadX, TIME_HEADER_HEIGHT, playheadX, TIME_HEADER_HEIGHT + contentHeight],
      { evented: false, selectable: false, stroke: PLAYHEAD_GLOW, strokeWidth: 8 },
    ),
  );

  // Line
  canvas.add(
    new fabric.Line(
      [playheadX, TIME_HEADER_HEIGHT, playheadX, TIME_HEADER_HEIGHT + contentHeight],
      { evented: false, selectable: false, stroke: PLAYHEAD_COLOR, strokeWidth: 2 },
    ),
  );

  // Handle (diamond shape at top)
  canvas.add(
    new fabric.Polygon(
      [
        { x: playheadX, y: TIME_HEADER_HEIGHT - 10 },
        { x: playheadX + 6, y: TIME_HEADER_HEIGHT - 4 },
        { x: playheadX, y: TIME_HEADER_HEIGHT + 2 },
        { x: playheadX - 6, y: TIME_HEADER_HEIGHT - 4 },
      ],
      { evented: false, fill: PLAYHEAD_COLOR, selectable: false },
    ),
  );

  canvas.requestRenderAll();
}

// =============================================================================
// Helpers
// =============================================================================

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
