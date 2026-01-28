import * as fabric from "fabric";

import type { CanvasController } from "../core/controller";
import type { FabricPlugin } from "../core/plugin";

export type ShortcutHandler = (e: KeyboardEvent) => void | boolean;

export interface ShortcutRegistration {
  handler: ShortcutHandler;
  source?: string;
}

const isMac = (): boolean => {
  if (typeof navigator === "undefined") {
    return false;
  }
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform);
};

export class ShortcutsPlugin implements FabricPlugin {
  readonly hotkeys = [
    "delete",
    "backspace",
    "escape",
    "space",
    "mod+a",
    "mod+z",
    "mod+shift+z",
  ];
  readonly name = "shortcuts";

  private boundKeyDown: ((e: KeyboardEvent) => void) | null = null;
  private boundKeyUp: ((e: KeyboardEvent) => void) | null = null;

  private canvas!: fabric.Canvas;
  private controller!: CanvasController;
  private handlers = new Map<string, ShortcutRegistration>();

  private isDragging = false;
  private lastPosX = 0;
  private lastPosY = 0;

  private onPanMouseDown = (opt: fabric.TPointerEventInfo): void => {
    const e = opt.e as MouseEvent;
    this.isDragging = true;
    this.lastPosX = e.clientX;
    this.lastPosY = e.clientY;
    this.canvas.setCursor("grabbing");
  };

  private onPanMouseMove = (opt: fabric.TPointerEventInfo): void => {
    if (!this.isDragging) {
      return;
    }

    const e = opt.e as MouseEvent;
    const vpt = this.canvas.viewportTransform;
    if (!vpt) {
      return;
    }

    vpt[4] += e.clientX - this.lastPosX;
    vpt[5] += e.clientY - this.lastPosY;

    this.lastPosX = e.clientX;
    this.lastPosY = e.clientY;
    this.canvas.requestRenderAll();

    this.controller.events.emit("pan:change", {
      x: vpt[4],
      y: vpt[5],
    });
  };

  private onPanMouseUp = (): void => {
    this.isDragging = false;
    this.canvas.setCursor("grab");
  };

  private prevCursor = "default";

  private prevSelection = true;

  private spaceHeld = false;

  destroy(): void {
    if (this.boundKeyDown) {
      window.removeEventListener("keydown", this.boundKeyDown);
      this.boundKeyDown = null;
    }
    if (this.boundKeyUp) {
      window.removeEventListener("keyup", this.boundKeyUp);
      this.boundKeyUp = null;
    }

    if (this.spaceHeld) {
      this.exitPanMode();
    }

    this.handlers.clear();
  }

  getAll(): Map<string, ShortcutRegistration> {
    return new Map(this.handlers);
  }

  has(shortcut: string): boolean {
    const normalized = this.normalizeShortcut(shortcut);
    return this.handlers.has(normalized);
  }

  init(canvas: fabric.Canvas, controller: CanvasController): void {
    this.canvas = canvas;
    this.controller = controller;

    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);

    window.addEventListener("keydown", this.boundKeyDown);
    window.addEventListener("keyup", this.boundKeyUp);

    this.registerDefaults();
  }

  register(shortcut: string, handler: ShortcutHandler, source?: string): void {
    const normalized = this.normalizeShortcut(shortcut);
    this.handlers.set(normalized, { handler, source });
  }

  unregister(shortcut: string): void {
    const normalized = this.normalizeShortcut(shortcut);
    this.handlers.delete(normalized);
  }

  private deleteSelected(): void {
    this.controller.deleteSelected();
  }

  private deselectAll(): void {
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
  }

  private enterPanMode(): void {
    if (this.spaceHeld) {
      return;
    }

    this.spaceHeld = true;
    this.prevCursor = this.canvas.defaultCursor ?? "default";
    this.prevSelection = this.canvas.selection ?? true;

    this.canvas.defaultCursor = "grab";
    this.canvas.selection = false;
    this.canvas.setCursor("grab");

    this.isDragging = false;

    this.canvas.on("mouse:down", this.onPanMouseDown);
    this.canvas.on("mouse:move", this.onPanMouseMove);
    this.canvas.on("mouse:up", this.onPanMouseUp);
  }

  private eventToShortcut(e: KeyboardEvent): string {
    const modifiers: string[] = [];

    if (e.ctrlKey) {
      modifiers.push("ctrl");
    }
    if (e.metaKey) {
      modifiers.push("meta");
    }
    if (e.shiftKey) {
      modifiers.push("shift");
    }
    if (e.altKey) {
      modifiers.push("alt");
    }

    modifiers.sort();

    let key = e.key.toLowerCase();

    if (e.code === "Delete") {
      key = "delete";
    }
    if (e.code === "Backspace") {
      key = "backspace";
    }
    if (e.code === "Escape") {
      key = "escape";
    }
    if (e.code === "Space") {
      key = "space";
    }

    return modifiers.length > 0 ? `${modifiers.join("+")}+${key}` : key;
  }

  private exitPanMode(): void {
    if (!this.spaceHeld) {
      return;
    }

    this.spaceHeld = false;
    this.canvas.defaultCursor = this.prevCursor;
    this.canvas.selection = this.prevSelection;
    this.canvas.setCursor(this.prevCursor);
    this.isDragging = false;

    this.canvas.off("mouse:down", this.onPanMouseDown);
    this.canvas.off("mouse:move", this.onPanMouseMove);
    this.canvas.off("mouse:up", this.onPanMouseUp);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.isInputFocused(e)) {
      return;
    }

    if (e.code === "Space" && !e.repeat) {
      e.preventDefault();
      this.enterPanMode();
      return;
    }

    const shortcut = this.eventToShortcut(e);

    const registration = this.handlers.get(shortcut);
    if (registration) {
      const result = registration.handler(e);
      if (result === true) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    if (e.code === "Space") {
      this.exitPanMode();
    }
  }

  private isInputFocused(e: KeyboardEvent): boolean {
    const target = e.target as HTMLElement;
    if (!target) {
      return false;
    }

    const tagName = target.tagName.toUpperCase();
    if (tagName === "INPUT" || tagName === "TEXTAREA") {
      return true;
    }

    if (target.isContentEditable) {
      return true;
    }

    const activeObject = this.canvas.getActiveObject();
    if (activeObject && "isEditing" in activeObject && activeObject.isEditing) {
      return true;
    }

    return false;
  }

  private normalizeShortcut(shortcut: string): string {
    const parts = shortcut.toLowerCase().split("+");
    const modifiers: string[] = [];
    let key = "";

    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed === "mod") {
        modifiers.push(isMac() ? "meta" : "ctrl");
      } else if (trimmed === "ctrl" || trimmed === "control") {
        modifiers.push("ctrl");
      } else if (
        trimmed === "cmd" ||
        trimmed === "meta" ||
        trimmed === "command"
      ) {
        modifiers.push("meta");
      } else if (trimmed === "shift") {
        modifiers.push("shift");
      } else if (trimmed === "alt" || trimmed === "option") {
        modifiers.push("alt");
      } else {
        key = trimmed;
      }
    }

    modifiers.sort();

    return modifiers.length > 0 ? `${modifiers.join("+")}+${key}` : key;
  }

  private registerDefaults(): void {
    this.register("delete", () => this.deleteSelected(), "shortcuts");
    this.register("backspace", () => this.deleteSelected(), "shortcuts");
    this.register("escape", () => this.deselectAll(), "shortcuts");
    this.register(
      "mod+a",
      (e) => {
        e.preventDefault();
        this.selectAll();
      },
      "shortcuts",
    );
  }

  private selectAll(): void {
    const objects = this.canvas.getObjects().filter((obj) => obj.selectable);
    if (objects.length === 0) {
      return;
    }

    if (objects.length === 1) {
      this.canvas.setActiveObject(objects[0]);
    } else {
      const selection = new fabric.ActiveSelection(objects, {
        canvas: this.canvas,
      });
      this.canvas.setActiveObject(selection);
    }
    this.canvas.requestRenderAll();
  }
}
