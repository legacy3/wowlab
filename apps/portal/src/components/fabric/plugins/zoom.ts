import * as fabric from "fabric";

import type { CanvasController } from "../core/controller";
import type { FabricPlugin } from "../core/plugin";
import type { ShortcutsPlugin } from "./shortcuts";

export interface ZoomPluginConfig {
  /** Enable mouse wheel zoom (default: true) */
  enableMouseWheel?: boolean;
  /** Maximum zoom level (default: uses controller config) */
  maxZoom?: number;
  /** Minimum zoom level (default: uses controller config) */
  minZoom?: number;
  /** Zoom step for button zoom (default: 0.2 = 20%) */
  zoomStep?: number;
}

export class ZoomPlugin implements FabricPlugin {
  readonly hotkeys = ["+", "-", "0", "mod+0"];
  readonly name = "zoom";

  private canvas!: fabric.Canvas;
  private config!: Required<ZoomPluginConfig>;
  private controller!: CanvasController;

  private handleMouseWheel = (opt: fabric.TPointerEventInfo): void => {
    const e = opt.e as WheelEvent;
    e.preventDefault();
    e.stopPropagation();

    const delta = e.deltaY;
    const current = this.canvas.getZoom();
    const zoom = current * 0.999 ** delta;
    const next = this.clampZoom(zoom);

    this.canvas.zoomToPoint(new fabric.Point(e.offsetX, e.offsetY), next);
    this.controller.notifyState();
  };

  constructor(private userConfig: ZoomPluginConfig = {}) {}

  get zoom(): number {
    return this.canvas.getZoom();
  }

  destroy(): void {
    this.canvas.off("mouse:wheel", this.handleMouseWheel);
    this.unregisterShortcuts();
  }

  init(canvas: fabric.Canvas, controller: CanvasController): void {
    this.canvas = canvas;
    this.controller = controller;

    // Merge user config with controller defaults
    this.config = {
      enableMouseWheel: this.userConfig.enableMouseWheel ?? true,
      maxZoom: this.userConfig.maxZoom ?? controller.maxZoom,
      minZoom: this.userConfig.minZoom ?? controller.minZoom,
      zoomStep: this.userConfig.zoomStep ?? 0.2,
    };

    if (this.config.enableMouseWheel) {
      this.canvas.on("mouse:wheel", this.handleMouseWheel);
    }

    this.registerShortcuts();
  }

  setZoom(zoom: number): void {
    const clamped = this.clampZoom(zoom);
    const center = this.canvas.getCenterPoint();
    this.canvas.zoomToPoint(new fabric.Point(center.x, center.y), clamped);
    this.controller.notifyState();
  }

  zoomIn(): void {
    const current = this.canvas.getZoom();
    const next = this.clampZoom(current * (1 + this.config.zoomStep));
    const center = new fabric.Point(
      this.controller.width / 2,
      this.controller.height / 2,
    );
    this.canvas.zoomToPoint(center, next);
    this.controller.notifyState();
  }

  zoomOneToOne(): void {
    this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    this.controller.notifyState();
  }

  zoomOut(): void {
    const current = this.canvas.getZoom();
    const next = this.clampZoom(current / (1 + this.config.zoomStep));
    const center = new fabric.Point(
      this.controller.width / 2,
      this.controller.height / 2,
    );
    this.canvas.zoomToPoint(center, next);
    this.controller.notifyState();
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
    this.controller.notifyState();
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
    this.controller.notifyState();
  }

  zoomToPoint(point: fabric.Point, zoom: number): void {
    const clamped = this.clampZoom(zoom);
    this.canvas.zoomToPoint(point, clamped);
    this.controller.notifyState();
  }

  zoomToSelection(padding = 50): void {
    const active = this.canvas.getActiveObject();
    if (!active) return;

    this.zoomToObject(active, padding);
  }

  private clampZoom(zoom: number): number {
    return Math.max(this.config.minZoom, Math.min(this.config.maxZoom, zoom));
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
