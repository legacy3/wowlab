import * as fabric from "fabric";

import type { CanvasController } from "../core/controller";
import type { FabricPlugin } from "../core/plugin";
import type { ShortcutsPlugin } from "./shortcuts";

export type InteractionMode = "selection" | "grab" | "drawing" | "disabled";

export interface InteractionPluginConfig {
  defaultMode?: InteractionMode;
  enableGrabShortcuts?: boolean;
}

export class InteractionPlugin implements FabricPlugin {
  readonly hotkeys = ["Space"];
  readonly name = "interaction";

  private canvas!: fabric.Canvas;
  private config: Required<InteractionPluginConfig>;
  private controller!: CanvasController;
  private currentMode: InteractionMode = "selection";
  private handleMouseDown = (opt: fabric.TPointerEventInfo): void => {
    const e = opt.e as MouseEvent;

    // Alt+click enables grab mode temporarily
    if (e.altKey && this.currentMode === "selection") {
      this.setGrab();
    }

    if (this.currentMode === "grab") {
      this.isPanning = true;
      this.canvas.defaultCursor = "grabbing";
      this.lastPosX = e.clientX;
      this.lastPosY = e.clientY;
    }
  };
  private handleMouseMove = (opt: fabric.TPointerEventInfo): void => {
    if (!this.isPanning || this.currentMode !== "grab") return;

    const e = opt.e as MouseEvent;
    const deltaX = e.clientX - this.lastPosX;
    const deltaY = e.clientY - this.lastPosY;

    this.canvas.relativePan(new fabric.Point(deltaX, deltaY));
    this.canvas.requestRenderAll();

    this.lastPosX = e.clientX;
    this.lastPosY = e.clientY;

    this.controller.events.emit("pan:change", {
      x: this.canvas.viewportTransform?.[4] ?? 0,
      y: this.canvas.viewportTransform?.[5] ?? 0,
    });
  };
  private handleMouseUp = (opt: fabric.TPointerEventInfo): void => {
    const e = opt.e as MouseEvent;

    if (this.isPanning) {
      this.isPanning = false;
      this.canvas.defaultCursor = "grab";

      // If Alt was used for temporary grab, return to selection
      if (!e.altKey && this.previousMode === "selection") {
        this.setSelection();
      }
    }
  };
  private isPanning = false;

  private lastPosX = 0;

  private lastPosY = 0;

  private previousMode: InteractionMode = "selection";

  constructor(config: InteractionPluginConfig = {}) {
    this.config = {
      defaultMode: config.defaultMode ?? "selection",
      enableGrabShortcuts: config.enableGrabShortcuts ?? true,
    };
  }

  get mode(): InteractionMode {
    return this.currentMode;
  }

  destroy(): void {
    this.canvas.off("mouse:down", this.handleMouseDown);
    this.canvas.off("mouse:move", this.handleMouseMove);
    this.canvas.off("mouse:up", this.handleMouseUp);
    this.unregisterShortcuts();
  }

  init(canvas: fabric.Canvas, controller: CanvasController): void {
    this.canvas = canvas;
    this.controller = controller;

    this.canvas.on("mouse:down", this.handleMouseDown);
    this.canvas.on("mouse:move", this.handleMouseMove);
    this.canvas.on("mouse:up", this.handleMouseUp);

    if (this.config.enableGrabShortcuts) {
      this.registerShortcuts();
    }

    this.setMode(this.config.defaultMode);
  }

  isDrawingMode(): boolean {
    return this.currentMode === "drawing";
  }

  isGrabMode(): boolean {
    return this.currentMode === "grab";
  }

  isSelectionMode(): boolean {
    return this.currentMode === "selection";
  }

  setDisabled(): void {
    this.setMode("disabled");
  }

  setDrawing(): void {
    this.setMode("drawing");
  }

  setGrab(): void {
    this.setMode("grab");
  }

  setMode(mode: InteractionMode): void {
    if (this.currentMode === mode) return;

    this.previousMode = this.currentMode;
    this.currentMode = mode;

    switch (mode) {
      case "disabled":
        this.applyDisabledMode();
        break;
      case "drawing":
        this.applyDrawingMode();
        break;
      case "grab":
        this.applyGrabMode();
        break;
      case "selection":
        this.applySelectionMode();
        break;
    }

    this.controller.events.emit("interaction:change", { mode });
  }

  setSelection(): void {
    this.setMode("selection");
  }

  toggleGrab(): void {
    if (this.currentMode === "grab") {
      this.setMode(
        this.previousMode === "grab" ? "selection" : this.previousMode,
      );
    } else {
      this.setGrab();
    }
  }

  private applyDisabledMode(): void {
    this.canvas.selection = false;
    this.canvas.defaultCursor = "default";

    for (const obj of this.canvas.getObjects()) {
      obj.selectable = false;
      obj.evented = false;
      obj.hoverCursor = "default";
    }

    this.canvas.requestRenderAll();
  }

  private applyDrawingMode(): void {
    this.canvas.selection = false;
    this.canvas.defaultCursor = "crosshair";

    for (const obj of this.canvas.getObjects()) {
      obj.selectable = false;
      obj.evented = false;
    }

    this.canvas.requestRenderAll();
  }

  private applyGrabMode(): void {
    this.canvas.selection = false;
    this.canvas.defaultCursor = "grab";

    for (const obj of this.canvas.getObjects()) {
      obj.selectable = false;
      obj.evented = false;
      obj.hoverCursor = "grab";
    }

    this.canvas.requestRenderAll();
  }

  private applySelectionMode(): void {
    this.canvas.selection = true;
    this.canvas.defaultCursor = "default";

    for (const obj of this.canvas.getObjects()) {
      obj.selectable = true;
      obj.evented = true;
      obj.hoverCursor = "move";
    }

    this.canvas.requestRenderAll();
  }

  private registerShortcuts(): void {
    const shortcuts = this.controller.plugins.get<ShortcutsPlugin>("shortcuts");
    if (!shortcuts) return;

    // Space to toggle grab mode
    shortcuts.register(
      "Space",
      (e) => {
        e.preventDefault();
        this.toggleGrab();
      },
      this.name,
    );
  }

  private unregisterShortcuts(): void {
    const shortcuts = this.controller.plugins.get<ShortcutsPlugin>("shortcuts");
    if (!shortcuts) return;

    shortcuts.unregister("Space");
  }
}
