import * as fabric from "fabric";

import type { CanvasController } from "../core/controller";
import type { FabricPlugin } from "../core/plugin";
import type { ShortcutsPlugin } from "./shortcuts";

export interface ZoomPluginConfig {
  maxZoom?: number;
  minZoom?: number;
  zoomStep?: number;
}

export class ZoomPlugin implements FabricPlugin {
  readonly hotkeys = ["+", "-", "0", "mod+0"];
  readonly name = "zoom";

  private canvas!: fabric.Canvas;
  private config: Required<ZoomPluginConfig>;
  private controller!: CanvasController;

  constructor(config: ZoomPluginConfig = {}) {
    this.config = {
      maxZoom: config.maxZoom ?? 20,
      minZoom: config.minZoom ?? 0.1,
      zoomStep: config.zoomStep ?? 0.05,
    };
  }

  get zoom(): number {
    return this.canvas.getZoom();
  }

  clampZoom(zoom: number): number {
    return Math.max(this.config.minZoom, Math.min(this.config.maxZoom, zoom));
  }

  destroy(): void {
    this.unregisterShortcuts();
  }

  init(canvas: fabric.Canvas, controller: CanvasController): void {
    this.canvas = canvas;
    this.controller = controller;
    this.registerShortcuts();
  }

  setZoom(zoom: number): void {
    const clamped = this.clampZoom(zoom);
    const center = this.canvas.getCenterPoint();
    this.canvas.zoomToPoint(new fabric.Point(center.x, center.y), clamped);
    this.emitZoomChange();
  }

  zoomIn(): void {
    const current = this.canvas.getZoom();
    const next = this.clampZoom(current + this.config.zoomStep);
    const center = this.canvas.getCenterPoint();
    this.canvas.zoomToPoint(new fabric.Point(center.x, center.y), next);
    this.emitZoomChange();
  }

  zoomOneToOne(): void {
    this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    this.emitZoomChange();
  }

  zoomOut(): void {
    const current = this.canvas.getZoom();
    const next = this.clampZoom(current - this.config.zoomStep);
    const center = this.canvas.getCenterPoint();
    this.canvas.zoomToPoint(new fabric.Point(center.x, center.y), next);
    this.emitZoomChange();
  }

  zoomToFit(padding = 50): void {
    const objects = this.canvas.getObjects();
    if (objects.length === 0) {
      this.zoomOneToOne();
      return;
    }

    // Get bounding box of all objects
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const obj of objects) {
      const bounds = obj.getBoundingRect();
      minX = Math.min(minX, bounds.left);
      minY = Math.min(minY, bounds.top);
      maxX = Math.max(maxX, bounds.left + bounds.width);
      maxY = Math.max(maxY, bounds.top + bounds.height);
    }

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    if (contentWidth === 0 || contentHeight === 0) {
      this.zoomOneToOne();
      return;
    }

    const canvasWidth = this.canvas.getWidth() - padding * 2;
    const canvasHeight = this.canvas.getHeight() - padding * 2;

    const scaleX = canvasWidth / contentWidth;
    const scaleY = canvasHeight / contentHeight;
    const zoom = this.clampZoom(Math.min(scaleX, scaleY));

    // Center content
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const canvasCenterX = this.canvas.getWidth() / 2;
    const canvasCenterY = this.canvas.getHeight() / 2;

    const panX = canvasCenterX - centerX * zoom;
    const panY = canvasCenterY - centerY * zoom;

    this.canvas.setViewportTransform([zoom, 0, 0, zoom, panX, panY]);
    this.emitZoomChange();
  }

  zoomToObject(obj: fabric.FabricObject, padding = 50): void {
    const bounds = obj.getBoundingRect();
    const contentWidth = bounds.width;
    const contentHeight = bounds.height;

    if (contentWidth === 0 || contentHeight === 0) return;

    const canvasWidth = this.canvas.getWidth() - padding * 2;
    const canvasHeight = this.canvas.getHeight() - padding * 2;

    const scaleX = canvasWidth / contentWidth;
    const scaleY = canvasHeight / contentHeight;
    const zoom = this.clampZoom(Math.min(scaleX, scaleY));

    // Center on object
    const centerX = bounds.left + contentWidth / 2;
    const centerY = bounds.top + contentHeight / 2;
    const canvasCenterX = this.canvas.getWidth() / 2;
    const canvasCenterY = this.canvas.getHeight() / 2;

    const panX = canvasCenterX - centerX * zoom;
    const panY = canvasCenterY - centerY * zoom;

    this.canvas.setViewportTransform([zoom, 0, 0, zoom, panX, panY]);
    this.emitZoomChange();
  }

  zoomToPoint(point: fabric.Point, zoom: number): void {
    const clamped = this.clampZoom(zoom);
    this.canvas.zoomToPoint(point, clamped);
    this.emitZoomChange();
  }

  zoomToSelection(padding = 50): void {
    const active = this.canvas.getActiveObject();
    if (!active) return;

    this.zoomToObject(active, padding);
  }

  private emitZoomChange(): void {
    const vpt = this.canvas.viewportTransform;
    this.controller.events.emit("zoom:change", {
      zoom: this.canvas.getZoom(),
    });
    this.controller.events.emit("pan:change", {
      x: vpt?.[4] ?? 0,
      y: vpt?.[5] ?? 0,
    });
  }

  private registerShortcuts(): void {
    const shortcuts = this.controller.plugins.get<ShortcutsPlugin>("shortcuts");
    if (!shortcuts) return;

    shortcuts.register(
      "+",
      (e) => {
        e.preventDefault();
        this.zoomIn();
      },
      this.name,
    );

    shortcuts.register(
      "-",
      (e) => {
        e.preventDefault();
        this.zoomOut();
      },
      this.name,
    );

    shortcuts.register(
      "0",
      (e) => {
        e.preventDefault();
        this.zoomOneToOne();
      },
      this.name,
    );

    shortcuts.register(
      "mod+0",
      (e) => {
        e.preventDefault();
        this.zoomToFit();
      },
      this.name,
    );
  }

  private unregisterShortcuts(): void {
    const shortcuts = this.controller.plugins.get<ShortcutsPlugin>("shortcuts");
    if (!shortcuts) return;

    shortcuts.unregister("+");
    shortcuts.unregister("-");
    shortcuts.unregister("0");
    shortcuts.unregister("mod+0");
  }
}
