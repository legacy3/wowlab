"use client";

import * as fabric from "fabric";

import type { CanvasConfig, CanvasState } from "./types";

import { EventEmitter } from "./events";
import { FabricPlugin, PluginRegistry } from "./plugin";

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

  get height(): number {
    return this.config.height;
  }

  get maxZoom(): number {
    return this.config.maxZoom;
  }

  get minZoom(): number {
    return this.config.minZoom;
  }

  get width(): number {
    return this.config.width;
  }

  get zoom(): number {
    return this.canvas.getZoom();
  }

  clear(): void {
    this.canvas.clear();
    this.canvas.backgroundColor = this.config.backgroundColor;
    this.canvas.requestRenderAll();
  }

  deleteSelected(): void {
    const active = this.canvas.getActiveObjects();
    if (active.length === 0) {
      return;
    }

    for (const obj of active) {
      this.canvas.remove(obj);
    }

    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
  }

  async dispose(): Promise<void> {
    this.events.emit("canvas:dispose");
    this.plugins.destroy();
    this.events.removeAllListeners();
    await this.canvas.dispose();
  }

  /** Notify state listeners of current viewport state */
  notifyState(): void {
    const vpt = this.canvas.viewportTransform;
    this.onStateChange?.({
      panX: vpt?.[4] ?? 0,
      panY: vpt?.[5] ?? 0,
      zoom: this.canvas.getZoom(),
    });
    this.events.emit("zoom:change", { zoom: this.canvas.getZoom() });
    this.events.emit("pan:change", { x: vpt?.[4] ?? 0, y: vpt?.[5] ?? 0 });
  }

  resetView(): void {
    this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    this.notifyState();
  }

  setDimensions(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
    this.canvas.setDimensions({ height, width });
    this.canvas.requestRenderAll();
    this.events.emit("canvas:resize", { height, width });
  }

  setStateListener(fn: (state: CanvasState) => void): void {
    this.onStateChange = fn;
    this.notifyState();
  }

  toDataURL(format: "png" | "jpeg" = "png", quality = 1): string {
    return this.canvas.toDataURL({ format, multiplier: 2, quality });
  }

  toJSON(): object {
    return this.canvas.toJSON();
  }

  toSVG(): string {
    return this.canvas.toSVG();
  }

  use(plugin: FabricPlugin): this {
    this.plugins.register(plugin, this.canvas, this);
    return this;
  }

  private setupCoreEvents(): void {
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
