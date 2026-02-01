import * as fabric from "fabric";

import type { CanvasController } from "../core/controller";
import type { FabricPlugin } from "../core/plugin";

export class AlignmentPlugin implements FabricPlugin {
  readonly name = "alignment";

  private canvas!: fabric.Canvas;
  private controller!: CanvasController;

  alignBottom(): void {
    const active = this.canvas.getActiveObject();
    if (!active || active.type !== "activeSelection") {
      return;
    }

    const selection = active as fabric.ActiveSelection;
    const bottom = (selection.height ?? 0) / 2;

    for (const obj of selection.getObjects()) {
      const height = obj.getScaledHeight();
      obj.set({ top: bottom - height });
      obj.setCoords();
    }

    this.canvas.requestRenderAll();
    this.controller.events.emit("alignment:change", { type: "bottom" });
  }

  alignCenter(): void {
    const active = this.canvas.getActiveObject();
    if (!active || active.type !== "activeSelection") {
      return;
    }

    const selection = active as fabric.ActiveSelection;

    for (const obj of selection.getObjects()) {
      const width = obj.getScaledWidth();
      obj.set({ left: -width / 2 });
      obj.setCoords();
    }

    this.canvas.requestRenderAll();
    this.controller.events.emit("alignment:change", { type: "center" });
  }

  alignLeft(): void {
    const active = this.canvas.getActiveObject();
    if (!active || active.type !== "activeSelection") {
      return;
    }

    const selection = active as fabric.ActiveSelection;
    const left = -(selection.width ?? 0) / 2;

    for (const obj of selection.getObjects()) {
      obj.set({ left });
      obj.setCoords();
    }

    this.canvas.requestRenderAll();
    this.controller.events.emit("alignment:change", { type: "left" });
  }

  alignMiddle(): void {
    const active = this.canvas.getActiveObject();
    if (!active || active.type !== "activeSelection") {
      return;
    }

    const selection = active as fabric.ActiveSelection;

    for (const obj of selection.getObjects()) {
      const height = obj.getScaledHeight();
      obj.set({ top: -height / 2 });
      obj.setCoords();
    }

    this.canvas.requestRenderAll();
    this.controller.events.emit("alignment:change", { type: "middle" });
  }

  alignRight(): void {
    const active = this.canvas.getActiveObject();
    if (!active || active.type !== "activeSelection") {
      return;
    }

    const selection = active as fabric.ActiveSelection;
    const right = (selection.width ?? 0) / 2;

    for (const obj of selection.getObjects()) {
      const width = obj.getScaledWidth();
      obj.set({ left: right - width });
      obj.setCoords();
    }

    this.canvas.requestRenderAll();
    this.controller.events.emit("alignment:change", { type: "right" });
  }

  alignTop(): void {
    const active = this.canvas.getActiveObject();
    if (!active || active.type !== "activeSelection") {
      return;
    }

    const selection = active as fabric.ActiveSelection;
    const top = -(selection.height ?? 0) / 2;

    for (const obj of selection.getObjects()) {
      obj.set({ top });
      obj.setCoords();
    }

    this.canvas.requestRenderAll();
    this.controller.events.emit("alignment:change", { type: "top" });
  }

  centerOnCanvas(): void {
    const active = this.canvas.getActiveObject();
    if (!active) {
      return;
    }

    const canvasCenter = this.canvas.getCenterPoint();
    const objWidth = active.getScaledWidth();
    const objHeight = active.getScaledHeight();

    active.set({
      left: canvasCenter.x - objWidth / 2,
      top: canvasCenter.y - objHeight / 2,
    });
    active.setCoords();

    this.canvas.requestRenderAll();
    this.controller.events.emit("alignment:change", { type: "canvas-center" });
  }

  centerOnCanvasHorizontal(): void {
    const active = this.canvas.getActiveObject();
    if (!active) {
      return;
    }

    const canvasCenter = this.canvas.getCenterPoint();
    const objWidth = active.getScaledWidth();

    active.set({ left: canvasCenter.x - objWidth / 2 });
    active.setCoords();

    this.canvas.requestRenderAll();
    this.controller.events.emit("alignment:change", {
      type: "canvas-center-horizontal",
    });
  }

  centerOnCanvasVertical(): void {
    const active = this.canvas.getActiveObject();
    if (!active) {
      return;
    }

    const canvasCenter = this.canvas.getCenterPoint();
    const objHeight = active.getScaledHeight();

    active.set({ top: canvasCenter.y - objHeight / 2 });
    active.setCoords();

    this.canvas.requestRenderAll();
    this.controller.events.emit("alignment:change", {
      type: "canvas-center-vertical",
    });
  }

  destroy(): void {}

  distributeHorizontal(): void {
    const active = this.canvas.getActiveObject();
    if (!active || active.type !== "activeSelection") {
      return;
    }

    const selection = active as fabric.ActiveSelection;
    const objects = selection.getObjects();
    if (objects.length < 3) {
      return;
    }

    const sorted = [...objects].sort((a, b) => (a.left ?? 0) - (b.left ?? 0));

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const firstLeft = first.left ?? 0;
    const lastRight = (last.left ?? 0) + last.getScaledWidth();

    let totalWidth = 0;
    for (const obj of sorted) {
      totalWidth += obj.getScaledWidth();
    }

    const totalSpace = lastRight - firstLeft - totalWidth;
    const gap = totalSpace / (sorted.length - 1);

    let currentLeft = firstLeft;
    for (const obj of sorted) {
      obj.set({ left: currentLeft });
      obj.setCoords();
      currentLeft += obj.getScaledWidth() + gap;
    }

    this.canvas.requestRenderAll();
    this.controller.events.emit("alignment:change", {
      type: "distribute-horizontal",
    });
  }

  distributeVertical(): void {
    const active = this.canvas.getActiveObject();
    if (!active || active.type !== "activeSelection") {
      return;
    }

    const selection = active as fabric.ActiveSelection;
    const objects = selection.getObjects();
    if (objects.length < 3) {
      return;
    }

    const sorted = [...objects].sort((a, b) => (a.top ?? 0) - (b.top ?? 0));

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const firstTop = first.top ?? 0;
    const lastBottom = (last.top ?? 0) + last.getScaledHeight();

    let totalHeight = 0;
    for (const obj of sorted) {
      totalHeight += obj.getScaledHeight();
    }

    const totalSpace = lastBottom - firstTop - totalHeight;
    const gap = totalSpace / (sorted.length - 1);

    let currentTop = firstTop;
    for (const obj of sorted) {
      obj.set({ top: currentTop });
      obj.setCoords();
      currentTop += obj.getScaledHeight() + gap;
    }

    this.canvas.requestRenderAll();
    this.controller.events.emit("alignment:change", {
      type: "distribute-vertical",
    });
  }

  init(canvas: fabric.Canvas, controller: CanvasController): void {
    this.canvas = canvas;
    this.controller = controller;
  }
}
