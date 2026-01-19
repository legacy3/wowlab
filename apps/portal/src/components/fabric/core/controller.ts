"use client";

import * as fabric from "fabric";

import type { CanvasConfig, CanvasState } from "./types";

import { EventEmitter } from "./events";
import { FabricPlugin, PluginRegistry } from "./plugin";

// =============================================================================
// Module Augmentation
// =============================================================================

declare module "fabric" {
  interface Canvas {
    isDragging?: boolean;
    lastPosX?: number;
    lastPosY?: number;
  }
}

// =============================================================================
// Canvas Controller - Slim Core
// =============================================================================

export class CanvasController {
  readonly canvas: fabric.Canvas;
  readonly events: EventEmitter;
  readonly plugins: PluginRegistry;

  private config: Required<CanvasConfig>;
  private onStateChange?: (state: CanvasState) => void;

  constructor(element: HTMLCanvasElement, config: CanvasConfig) {
    this.config = {
      backgroundColor: config.backgroundColor ?? "transparent",
      height: config.height,
      maxZoom: config.maxZoom ?? 20,
      minZoom: config.minZoom ?? 0.1,
      width: config.width,
    };

    this.canvas = new fabric.Canvas(element, {
      backgroundColor: this.config.backgroundColor,
      enableRetinaScaling: true,
      height: this.config.height,
      preserveObjectStacking: true,
      renderOnAddRemove: false,
      selection: true,
      stopContextMenu: true,
      width: this.config.width,
    });

    this.events = new EventEmitter();
    this.plugins = new PluginRegistry();

    this.setupCoreEvents();
    this.events.emit("canvas:ready");
  }

  // ===========================================================================
  // Getters
  // ===========================================================================

  get height() {
    return this.config.height;
  }

  get width() {
    return this.config.width;
  }

  get zoom() {
    return this.canvas.getZoom();
  }

  // ===========================================================================
  // Plugin Registration
  // ===========================================================================

  clear() {
    this.canvas.clear();
    this.canvas.backgroundColor = this.config.backgroundColor;
    this.canvas.requestRenderAll();
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  deleteSelected() {
    const active = this.canvas.getActiveObjects();
    if (active.length === 0) return;

    for (const obj of active) {
      this.canvas.remove(obj);
    }
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
  }

  async dispose() {
    this.events.emit("canvas:dispose");
    this.plugins.destroy();
    this.events.removeAllListeners();
    await this.canvas.dispose();
  }

  resetView() {
    this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    this.notify();
  }

  setDimensions(width: number, height: number) {
    this.config.width = width;
    this.config.height = height;
    this.canvas.setDimensions({ height, width });
    this.canvas.requestRenderAll();
    this.events.emit("canvas:resize", { height, width });
  }

  setStateListener(fn: (state: CanvasState) => void) {
    this.onStateChange = fn;
    this.notify();
  }

  toDataURL(format: "png" | "jpeg" = "png", quality = 1): string {
    return this.canvas.toDataURL({ format, multiplier: 2, quality });
  }

  toJSON() {
    return this.canvas.toJSON();
  }

  toSVG(): string {
    return this.canvas.toSVG();
  }

  use(plugin: FabricPlugin): this {
    this.plugins.register(plugin, this.canvas, this);
    return this;
  }

  zoomIn() {
    const current = this.canvas.getZoom();
    const next = Math.min(this.config.maxZoom, current * 1.2);
    const center = new fabric.Point(
      this.config.width / 2,
      this.config.height / 2,
    );
    this.canvas.zoomToPoint(center, next);
    this.notify();
  }

  zoomOut() {
    const current = this.canvas.getZoom();
    const next = Math.max(this.config.minZoom, current / 1.2);
    const center = new fabric.Point(
      this.config.width / 2,
      this.config.height / 2,
    );
    this.canvas.zoomToPoint(center, next);
    this.notify();
  }

  zoomToPoint(point: fabric.Point, zoom: number) {
    const clamped = Math.max(
      this.config.minZoom,
      Math.min(this.config.maxZoom, zoom),
    );
    this.canvas.zoomToPoint(point, clamped);
    this.notify();
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private notify() {
    const vpt = this.canvas.viewportTransform;
    this.onStateChange?.({
      panX: vpt?.[4] ?? 0,
      panY: vpt?.[5] ?? 0,
      zoom: this.canvas.getZoom(),
    });
    this.events.emit("zoom:change", { zoom: this.canvas.getZoom() });
    this.events.emit("pan:change", { x: vpt?.[4] ?? 0, y: vpt?.[5] ?? 0 });
  }

  private setupCoreEvents() {
    // Mouse wheel zoom
    this.canvas.on("mouse:wheel", (opt) => {
      const e = opt.e;
      e.preventDefault();
      e.stopPropagation();

      const delta = e.deltaY;
      const current = this.canvas.getZoom();
      const zoom = current * 0.999 ** delta;
      const next = Math.max(
        this.config.minZoom,
        Math.min(this.config.maxZoom, zoom),
      );

      this.canvas.zoomToPoint(new fabric.Point(e.offsetX, e.offsetY), next);
      this.notify();
    });

    // Selection changes
    this.canvas.on("selection:created", (e) => {
      this.events.emit("selection:change", { objects: e.selected ?? [] });
    });

    this.canvas.on("selection:updated", (e) => {
      this.events.emit("selection:change", { objects: e.selected ?? [] });
    });

    this.canvas.on("selection:cleared", () => {
      this.events.emit("selection:change", { objects: [] });
    });
  }
}
