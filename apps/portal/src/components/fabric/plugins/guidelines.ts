import * as fabric from "fabric";

import type { CanvasController } from "../core/controller";
import type { FabricPlugin } from "../core/plugin";

// =============================================================================
// Types
// =============================================================================

export interface GuidelinesConfig {
  /** Line color. Default: "rgba(255, 95, 95, 1)" */
  color?: string;
  /** Line offset beyond object edges. Default: 5 */
  lineOffset?: number;
  /** Line width in pixels. Default: 1 */
  lineWidth?: number;
  /** Snap margin in pixels - how close objects must be to snap. Default: 4 */
  snapMargin?: number;
}

interface HorizontalLine {
  x1: number;
  x2: number;
  y: number;
}

interface VerticalLine {
  x: number;
  y1: number;
  y2: number;
}

// =============================================================================
// Guidelines Plugin
// =============================================================================

/**
 * Smart alignment plugin that shows guidelines when moving/scaling objects
 * and snaps them to edges/centers of other objects.
 */
export class GuidelinesPlugin implements FabricPlugin {
  readonly name = "guidelines";

  private activeHeight = 0;
  // Cached state for scaling operations
  private activeLeft = 0;

  private activeTop = 0;
  private activeWidth = 0;
  private canvas!: fabric.Canvas;

  private config: Required<GuidelinesConfig>;
  private controller!: CanvasController;
  private handleAfterRender = (): void => {
    const ctx = this.canvas.getSelectionContext();
    if (!ctx) return;

    const vpt = this.canvas.viewportTransform;
    const zoom = this.canvas.getZoom();
    if (!vpt) return;

    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = this.config.lineWidth;
    ctx.strokeStyle = this.config.color;

    // Draw vertical lines
    for (const line of this.verticalLines) {
      this.drawVerticalLine(ctx, line, vpt, zoom);
    }

    // Draw horizontal lines
    for (const line of this.horizontalLines) {
      this.drawHorizontalLine(ctx, line, vpt, zoom);
    }

    ctx.stroke();
    ctx.restore();
  };
  private handleBeforeRender = (): void => {
    // Clear the selection context before rendering
    // Guard against null context (e.g., during image export)
    if (this.canvas.contextTop === null) return;

    try {
      this.canvas.clearContext(this.canvas.contextTop);
    } catch {
      // Ignore errors during context clearing
    }
  };

  private handleMouseDown = (e: fabric.TPointerEventInfo): void => {
    if (!e.target) return;

    // Cache initial dimensions for scaling operations
    this.activeLeft = e.target.left ?? 0;
    this.activeTop = e.target.top ?? 0;
    this.activeWidth = e.target.getScaledWidth();
    this.activeHeight = e.target.getScaledHeight();
  };

  // ===========================================================================
  // Lifecycle
  // ===========================================================================

  private handleMouseUp = (): void => {
    this.verticalLines = [];
    this.horizontalLines = [];
    this.canvas.requestRenderAll();
  };

  private handleObjectMoving = (
    e: { target: fabric.FabricObject } & fabric.BasicTransformEvent,
  ): void => {
    const activeObject = e.target;
    if (!activeObject) return;

    const vpt = this.canvas.viewportTransform;
    if (!vpt) return;

    const canvasObjects = this.canvas.getObjects();
    const activeCenter = activeObject.getCenterPoint();
    const activeObjectLeft = activeCenter.x;
    const activeObjectTop = activeCenter.y;
    const activeObjectWidth = activeObject.getScaledWidth();
    const activeObjectHeight = activeObject.getScaledHeight();

    let horizontalInRange = false;
    let verticalInRange = false;

    // Track snap positions for combining horizontal + vertical snaps
    let reachLeft = false;
    let reachTop = false;
    let snapX = 0;
    let snapY = 0;

    // Clear previous lines
    this.verticalLines = [];
    this.horizontalLines = [];

    for (let i = canvasObjects.length; i--; ) {
      const obj = canvasObjects[i];
      if (obj === activeObject) continue;
      if (!obj.visible || obj.evented === false) continue;

      const objectCenter = obj.getCenterPoint();
      const objectLeft = objectCenter.x;
      const objectTop = objectCenter.y;
      const objectBoundingRect = obj.getBoundingRect();
      const objectWidth = objectBoundingRect.width / vpt[0];
      const objectHeight = objectBoundingRect.height / vpt[3];

      // =========================================================================
      // Vertical alignments (check X coordinates)
      // =========================================================================

      // Horizontal center to horizontal center
      if (this.isInRange(objectLeft, activeObjectLeft)) {
        verticalInRange = true;
        this.verticalLines.push(
          this.createVerticalLine(
            objectLeft,
            objectTop,
            objectHeight,
            activeObjectTop,
            activeObjectHeight,
          ),
        );
        snapX = objectLeft;
        reachLeft = true;
      }

      // Left edge to left edge
      if (
        this.isInRange(
          objectLeft - objectWidth / 2,
          activeObjectLeft - activeObjectWidth / 2,
        )
      ) {
        verticalInRange = true;
        reachLeft = true;
        const x = objectLeft - objectWidth / 2;
        this.verticalLines.push(
          this.createVerticalLine(
            x,
            objectTop,
            objectHeight,
            activeObjectTop,
            activeObjectHeight,
          ),
        );
        snapX = x + activeObjectWidth / 2;
      }

      // Right edge to right edge
      if (
        this.isInRange(
          objectLeft + objectWidth / 2,
          activeObjectLeft + activeObjectWidth / 2,
        )
      ) {
        verticalInRange = true;
        reachLeft = true;
        const x = objectLeft + objectWidth / 2;
        this.verticalLines.push(
          this.createVerticalLine(
            x,
            objectTop,
            objectHeight,
            activeObjectTop,
            activeObjectHeight,
          ),
        );
        snapX = x - activeObjectWidth / 2;
      }

      // Left edge to right edge (object spacing)
      if (
        this.isInRange(
          objectLeft - objectWidth / 2,
          activeObjectLeft + activeObjectWidth / 2,
        )
      ) {
        verticalInRange = true;
        reachLeft = true;
        const x = objectLeft - objectWidth / 2;
        this.verticalLines.push(
          this.createVerticalLine(
            x,
            objectTop,
            objectHeight,
            activeObjectTop,
            activeObjectHeight,
          ),
        );
        snapX = x - activeObjectWidth / 2;
      }

      // Right edge to left edge (object spacing)
      if (
        this.isInRange(
          objectLeft + objectWidth / 2,
          activeObjectLeft - activeObjectWidth / 2,
        )
      ) {
        verticalInRange = true;
        reachLeft = true;
        const x = objectLeft + objectWidth / 2;
        this.verticalLines.push(
          this.createVerticalLine(
            x,
            objectTop,
            objectHeight,
            activeObjectTop,
            activeObjectHeight,
          ),
        );
        snapX = x + activeObjectWidth / 2;
      }

      // =========================================================================
      // Horizontal alignments (check Y coordinates)
      // =========================================================================

      // Vertical center to vertical center
      if (this.isInRange(objectTop, activeObjectTop)) {
        horizontalInRange = true;
        reachTop = true;
        this.horizontalLines.push(
          this.createHorizontalLine(
            objectTop,
            objectLeft,
            objectWidth,
            activeObjectLeft,
            activeObjectWidth,
          ),
        );
        snapY = objectTop;
      }

      // Top edge to top edge
      if (
        this.isInRange(
          objectTop - objectHeight / 2,
          activeObjectTop - activeObjectHeight / 2,
        )
      ) {
        horizontalInRange = true;
        reachTop = true;
        const y = objectTop - objectHeight / 2;
        this.horizontalLines.push(
          this.createHorizontalLine(
            y,
            objectLeft,
            objectWidth,
            activeObjectLeft,
            activeObjectWidth,
          ),
        );
        snapY = y + activeObjectHeight / 2;
      }

      // Bottom edge to bottom edge
      if (
        this.isInRange(
          objectTop + objectHeight / 2,
          activeObjectTop + activeObjectHeight / 2,
        )
      ) {
        horizontalInRange = true;
        reachTop = true;
        const y = objectTop + objectHeight / 2;
        this.horizontalLines.push(
          this.createHorizontalLine(
            y,
            objectLeft,
            objectWidth,
            activeObjectLeft,
            activeObjectWidth,
          ),
        );
        snapY = y - activeObjectHeight / 2;
      }

      // Top edge to bottom edge (object spacing)
      if (
        this.isInRange(
          objectTop - objectHeight / 2,
          activeObjectTop + activeObjectHeight / 2,
        )
      ) {
        horizontalInRange = true;
        reachTop = true;
        const y = objectTop - objectHeight / 2;
        this.horizontalLines.push(
          this.createHorizontalLine(
            y,
            objectLeft,
            objectWidth,
            activeObjectLeft,
            activeObjectWidth,
          ),
        );
        snapY = y - activeObjectHeight / 2;
      }

      // Bottom edge to top edge (object spacing)
      if (
        this.isInRange(
          objectTop + objectHeight / 2,
          activeObjectTop - activeObjectHeight / 2,
        )
      ) {
        horizontalInRange = true;
        reachTop = true;
        const y = objectTop + objectHeight / 2;
        this.horizontalLines.push(
          this.createHorizontalLine(
            y,
            objectLeft,
            objectWidth,
            activeObjectLeft,
            activeObjectWidth,
          ),
        );
        snapY = y + activeObjectHeight / 2;
      }
    }

    // Apply snapping
    if (reachLeft || reachTop) {
      const newX = reachLeft ? snapX : activeObjectLeft;
      const newY = reachTop ? snapY : activeObjectTop;
      activeObject.setPositionByOrigin(
        new fabric.Point(newX, newY),
        "center",
        "center",
      );
    }

    // Clear lines if not in range
    if (!horizontalInRange) {
      this.horizontalLines = [];
    }
    if (!verticalInRange) {
      this.verticalLines = [];
    }
  };

  // ===========================================================================
  // Event Handlers
  // ===========================================================================

  private handleObjectScaling = (
    e: {
      target: fabric.FabricObject;
      transform: fabric.Transform;
    } & fabric.BasicTransformEvent,
  ): void => {
    const activeObject = e.target;
    if (!activeObject || !e.transform) return;

    const vpt = this.canvas.viewportTransform;
    if (!vpt) return;

    const canvasObjects = this.canvas.getObjects();
    const activeCenter = activeObject.getCenterPoint();
    const activeObjectLeft = activeCenter.x;
    const activeObjectTop = activeCenter.y;
    const activeObjectWidth = activeObject.getScaledWidth();
    const activeObjectHeight = activeObject.getScaledHeight();
    const corner = e.transform.corner;

    let horizontalInRange = false;
    let verticalInRange = false;

    // Clear previous lines
    this.verticalLines = [];
    this.horizontalLines = [];

    // Define which corners affect which edges
    const leftCorners = new Set(["bl", "ml", "tl"]);
    const rightCorners = new Set(["br", "mr", "tr"]);
    const topCorners = new Set(["mt", "tl", "tr"]);
    const bottomCorners = new Set(["bl", "br", "mb"]);

    for (let i = canvasObjects.length; i--; ) {
      const obj = canvasObjects[i];
      if (obj === activeObject) continue;
      if (!obj.visible || obj.evented === false) continue;

      const objectCenter = obj.getCenterPoint();
      const objectLeft = objectCenter.x;
      const objectTop = objectCenter.y;
      const objectBoundingRect = obj.getBoundingRect();
      const objectWidth = objectBoundingRect.width / vpt[0];
      const objectHeight = objectBoundingRect.height / vpt[3];

      // =========================================================================
      // Vertical alignments during scaling
      // =========================================================================

      // Center alignment
      if (this.isInRange(objectLeft, activeObjectLeft)) {
        verticalInRange = true;
        this.verticalLines.push(
          this.createVerticalLine(
            objectLeft,
            objectTop,
            objectHeight,
            activeObjectTop,
            activeObjectHeight,
          ),
        );
      }

      // Left edge alignment
      if (
        this.isInRange(
          objectLeft - objectWidth / 2,
          activeObjectLeft - activeObjectWidth / 2,
        )
      ) {
        verticalInRange = true;
        const x = objectLeft - objectWidth / 2;
        this.verticalLines.push(
          this.createVerticalLine(
            x,
            objectTop,
            objectHeight,
            activeObjectTop,
            activeObjectHeight,
          ),
        );

        if (leftCorners.has(corner)) {
          const targetLeft = x;
          activeObject.setPositionByOrigin(
            new fabric.Point(
              targetLeft + activeObjectWidth / 2,
              activeObjectTop,
            ),
            "center",
            "center",
          );
          activeObject.set(
            "scaleX",
            ((this.activeLeft - targetLeft + this.activeWidth) *
              (activeObject.scaleX ?? 1)) /
              activeObject.getScaledWidth(),
          );
          break;
        }
      }

      // Right edge alignment
      if (
        this.isInRange(
          objectLeft + objectWidth / 2,
          activeObjectLeft + activeObjectWidth / 2,
        )
      ) {
        verticalInRange = true;
        const x = objectLeft + objectWidth / 2;
        this.verticalLines.push(
          this.createVerticalLine(
            x,
            objectTop,
            objectHeight,
            activeObjectTop,
            activeObjectHeight,
          ),
        );

        if (rightCorners.has(corner)) {
          const targetRight = x;
          activeObject.set(
            "scaleX",
            ((targetRight -
              (this.activeLeft + this.activeWidth) +
              this.activeWidth) *
              (activeObject.scaleX ?? 1)) /
              activeObject.getScaledWidth(),
          );
          break;
        }
      }

      // Left to right edge (spacing)
      if (
        this.isInRange(
          objectLeft - objectWidth / 2,
          activeObjectLeft + activeObjectWidth / 2,
        )
      ) {
        verticalInRange = true;
        const x = objectLeft - objectWidth / 2;
        this.verticalLines.push(
          this.createVerticalLine(
            x,
            objectTop,
            objectHeight,
            activeObjectTop,
            activeObjectHeight,
          ),
        );

        if (rightCorners.has(corner)) {
          activeObject.set(
            "scaleX",
            ((x - (activeObject.left ?? 0)) * (activeObject.scaleX ?? 1)) /
              activeObject.getScaledWidth(),
          );
          break;
        }
      }

      // Right to left edge (spacing)
      if (
        this.isInRange(
          objectLeft + objectWidth / 2,
          activeObjectLeft - activeObjectWidth / 2,
        )
      ) {
        verticalInRange = true;
        const x = objectLeft + objectWidth / 2;
        this.verticalLines.push(
          this.createVerticalLine(
            x,
            objectTop,
            objectHeight,
            activeObjectTop,
            activeObjectHeight,
          ),
        );

        if (leftCorners.has(corner)) {
          activeObject.setPositionByOrigin(
            new fabric.Point(x + activeObjectWidth / 2, activeObjectTop),
            "center",
            "center",
          );
          activeObject.set(
            "scaleX",
            ((this.activeLeft + this.activeWidth - x) *
              (activeObject.scaleX ?? 1)) /
              activeObject.getScaledWidth(),
          );
          break;
        }
      }

      // =========================================================================
      // Horizontal alignments during scaling
      // =========================================================================

      // Center alignment
      if (this.isInRange(objectTop, activeObjectTop)) {
        horizontalInRange = true;
        this.horizontalLines.push(
          this.createHorizontalLine(
            objectTop,
            objectLeft,
            objectWidth,
            activeObjectLeft,
            activeObjectWidth,
          ),
        );
      }

      // Top edge alignment
      if (
        this.isInRange(
          objectTop - objectHeight / 2,
          activeObjectTop - activeObjectHeight / 2,
        )
      ) {
        horizontalInRange = true;
        const y = objectTop - objectHeight / 2;
        this.horizontalLines.push(
          this.createHorizontalLine(
            y,
            objectLeft,
            objectWidth,
            activeObjectLeft,
            activeObjectWidth,
          ),
        );

        if (topCorners.has(corner)) {
          const targetTop = y;
          activeObject.setPositionByOrigin(
            new fabric.Point(
              activeObjectLeft,
              targetTop + activeObjectHeight / 2,
            ),
            "center",
            "center",
          );
          activeObject.set(
            "scaleY",
            ((this.activeTop + this.activeHeight - targetTop) *
              (activeObject.scaleY ?? 1)) /
              activeObject.getScaledHeight(),
          );
          break;
        }
      }

      // Bottom edge alignment
      if (
        this.isInRange(
          objectTop + objectHeight / 2,
          activeObjectTop + activeObjectHeight / 2,
        )
      ) {
        horizontalInRange = true;
        const y = objectTop + objectHeight / 2;
        this.horizontalLines.push(
          this.createHorizontalLine(
            y,
            objectLeft,
            objectWidth,
            activeObjectLeft,
            activeObjectWidth,
          ),
        );

        if (bottomCorners.has(corner)) {
          const targetBottom = y;
          activeObject.set(
            "scaleY",
            ((targetBottom -
              (this.activeTop + this.activeHeight) +
              this.activeHeight) *
              (activeObject.scaleY ?? 1)) /
              activeObject.getScaledHeight(),
          );
          break;
        }
      }

      // Top to bottom edge (spacing)
      if (
        this.isInRange(
          objectTop - objectHeight / 2,
          activeObjectTop + activeObjectHeight / 2,
        )
      ) {
        horizontalInRange = true;
        const y = objectTop - objectHeight / 2;
        this.horizontalLines.push(
          this.createHorizontalLine(
            y,
            objectLeft,
            objectWidth,
            activeObjectLeft,
            activeObjectWidth,
          ),
        );

        if (bottomCorners.has(corner)) {
          activeObject.set(
            "scaleY",
            ((y - (activeObject.top ?? 0)) * (activeObject.scaleY ?? 1)) /
              activeObject.getScaledHeight(),
          );
          break;
        }
      }

      // Bottom to top edge (spacing)
      if (
        this.isInRange(
          objectTop + objectHeight / 2,
          activeObjectTop - activeObjectHeight / 2,
        )
      ) {
        horizontalInRange = true;
        const y = objectTop + objectHeight / 2;
        this.horizontalLines.push(
          this.createHorizontalLine(
            y,
            objectLeft,
            objectWidth,
            activeObjectLeft,
            activeObjectWidth,
          ),
        );

        if (topCorners.has(corner)) {
          activeObject.setPositionByOrigin(
            new fabric.Point(activeObjectLeft, y + activeObjectHeight / 2),
            "center",
            "center",
          );
          activeObject.set(
            "scaleY",
            ((this.activeTop + this.activeHeight - y) *
              (activeObject.scaleY ?? 1)) /
              activeObject.getScaledHeight(),
          );
          break;
        }
      }
    }

    // Clear lines if not in range
    if (!horizontalInRange) {
      this.horizontalLines = [];
    }
    if (!verticalInRange) {
      this.verticalLines = [];
    }
  };

  private horizontalLines: HorizontalLine[] = [];

  private verticalLines: VerticalLine[] = [];

  constructor(config: GuidelinesConfig = {}) {
    this.config = {
      color: config.color ?? "rgba(255, 95, 95, 1)",
      lineOffset: config.lineOffset ?? 5,
      lineWidth: config.lineWidth ?? 1,
      snapMargin: config.snapMargin ?? 4,
    };
  }

  destroy(): void {
    this.canvas.off("mouse:down", this.handleMouseDown);
    this.canvas.off("object:moving", this.handleObjectMoving);
    this.canvas.off("object:scaling", this.handleObjectScaling);
    this.canvas.off("before:render", this.handleBeforeRender);
    this.canvas.off("after:render", this.handleAfterRender);
    this.canvas.off("mouse:up", this.handleMouseUp);

    this.verticalLines = [];
    this.horizontalLines = [];
  }

  init(canvas: fabric.Canvas, controller: CanvasController): void {
    this.canvas = canvas;
    this.controller = controller;

    this.canvas.on("mouse:down", this.handleMouseDown);
    this.canvas.on("object:moving", this.handleObjectMoving);
    this.canvas.on("object:scaling", this.handleObjectScaling);
    this.canvas.on("before:render", this.handleBeforeRender);
    this.canvas.on("after:render", this.handleAfterRender);
    this.canvas.on("mouse:up", this.handleMouseUp);
  }

  // ===========================================================================
  // Helper Methods
  // ===========================================================================

  /**
   * Create a horizontal guide line structure.
   */
  private createHorizontalLine(
    y: number,
    objectLeft: number,
    objectWidth: number,
    activeLeft: number,
    activeWidth: number,
  ): HorizontalLine {
    const offset = this.config.lineOffset;
    return {
      x1:
        objectLeft < activeLeft
          ? objectLeft - objectWidth / 2 - offset
          : objectLeft + objectWidth / 2 + offset,
      x2:
        activeLeft > objectLeft
          ? activeLeft + activeWidth / 2 + offset
          : activeLeft - activeWidth / 2 - offset,
      y,
    };
  }

  /**
   * Create a vertical guide line structure.
   */
  private createVerticalLine(
    x: number,
    objectTop: number,
    objectHeight: number,
    activeTop: number,
    activeHeight: number,
  ): VerticalLine {
    const offset = this.config.lineOffset;
    return {
      x,
      y1:
        objectTop < activeTop
          ? objectTop - objectHeight / 2 - offset
          : objectTop + objectHeight / 2 + offset,
      y2:
        activeTop > objectTop
          ? activeTop + activeHeight / 2 + offset
          : activeTop - activeHeight / 2 - offset,
    };
  }

  /**
   * Draw a horizontal line on the canvas context.
   */
  private drawHorizontalLine(
    ctx: CanvasRenderingContext2D,
    line: HorizontalLine,
    vpt: number[],
    zoom: number,
  ): void {
    const y = line.y * zoom + vpt[5] + 0.5;
    const x1 = Math.min(line.x1, line.x2) * zoom + vpt[4];
    const x2 = Math.max(line.x1, line.x2) * zoom + vpt[4];

    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
  }

  /**
   * Draw a vertical line on the canvas context.
   */
  private drawVerticalLine(
    ctx: CanvasRenderingContext2D,
    line: VerticalLine,
    vpt: number[],
    zoom: number,
  ): void {
    const x = line.x * zoom + vpt[4] + 0.5;
    const y1 = Math.min(line.y1, line.y2) * zoom + vpt[5];
    const y2 = Math.max(line.y1, line.y2) * zoom + vpt[5];

    ctx.moveTo(x, y1);
    ctx.lineTo(x, y2);
  }

  /**
   * Check if two values are within the snap margin.
   */
  private isInRange(value1: number, value2: number): boolean {
    const v1 = Math.round(value1);
    const v2 = Math.round(value2);
    return Math.abs(v1 - v2) <= this.config.snapMargin;
  }
}
