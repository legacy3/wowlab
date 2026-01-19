import * as fabric from "fabric";

import type { CanvasController } from "../core/controller";
import type { FabricPlugin } from "../core/plugin";

// =============================================================================
// Types
// =============================================================================

export type ShortcutHandler = (e: KeyboardEvent) => void | boolean;

export interface ShortcutRegistration {
  handler: ShortcutHandler;
  /** Source plugin that registered this shortcut */
  source?: string;
}

// =============================================================================
// Platform Detection
// =============================================================================

const isMac = (): boolean => {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform);
};

// =============================================================================
// Shortcuts Plugin
// =============================================================================

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
  private onPanMouseDown = (opt: fabric.TPointerEventInfo): void => {
    const e = opt.e as MouseEvent;
    this.canvas.isDragging = true;
    this.canvas.lastPosX = e.clientX;
    this.canvas.lastPosY = e.clientY;
    this.canvas.setCursor("grabbing");
  };

  private onPanMouseMove = (opt: fabric.TPointerEventInfo): void => {
    if (!this.canvas.isDragging) return;

    const e = opt.e as MouseEvent;
    const vpt = this.canvas.viewportTransform;
    if (!vpt) return;

    vpt[4] += e.clientX - (this.canvas.lastPosX ?? 0);
    vpt[5] += e.clientY - (this.canvas.lastPosY ?? 0);

    this.canvas.lastPosX = e.clientX;
    this.canvas.lastPosY = e.clientY;
    this.canvas.requestRenderAll();

    this.controller.events.emit("pan:change", {
      x: vpt[4],
      y: vpt[5],
    });
  };
  private onPanMouseUp = (): void => {
    this.canvas.isDragging = false;
    this.canvas.setCursor("grab");
  };

  // ===========================================================================
  // Lifecycle
  // ===========================================================================

  private prevCursor = "default";

  private prevSelection = true;

  // ===========================================================================
  // Public API
  // ===========================================================================

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

    // Reset pan mode if space was held
    if (this.spaceHeld) {
      this.exitPanMode();
    }

    this.handlers.clear();
  }

  /**
   * Get all registered shortcuts.
   */
  getAll(): Map<string, ShortcutRegistration> {
    return new Map(this.handlers);
  }

  /**
   * Check if a shortcut is registered.
   */
  has(shortcut: string): boolean {
    const normalized = this.normalizeShortcut(shortcut);
    return this.handlers.has(normalized);
  }

  // ===========================================================================
  // Default Shortcuts
  // ===========================================================================

  init(canvas: fabric.Canvas, controller: CanvasController): void {
    this.canvas = canvas;
    this.controller = controller;

    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);

    window.addEventListener("keydown", this.boundKeyDown);
    window.addEventListener("keyup", this.boundKeyUp);

    // Register default shortcuts
    this.registerDefaults();
  }

  /**
   * Register a shortcut handler.
   * Use "mod" for platform-aware modifier (Cmd on Mac, Ctrl on Windows).
   * Examples: "mod+z", "mod+shift+z", "delete", "escape"
   */
  register(shortcut: string, handler: ShortcutHandler, source?: string): void {
    const normalized = this.normalizeShortcut(shortcut);
    this.handlers.set(normalized, { handler, source });
  }

  /**
   * Unregister a shortcut handler.
   */
  unregister(shortcut: string): void {
    const normalized = this.normalizeShortcut(shortcut);
    this.handlers.delete(normalized);
  }

  private deleteSelected(): void {
    this.controller.deleteSelected();
  }

  // ===========================================================================
  // Pan Mode (Space held)
  // ===========================================================================

  private deselectAll(): void {
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
  }

  private enterPanMode(): void {
    if (this.spaceHeld) return;

    this.spaceHeld = true;
    this.prevCursor = this.canvas.defaultCursor ?? "default";
    this.prevSelection = this.canvas.selection ?? true;

    this.canvas.defaultCursor = "grab";
    this.canvas.selection = false;
    this.canvas.setCursor("grab");

    // Enable drag panning
    this.canvas.isDragging = false;

    this.canvas.on("mouse:down", this.onPanMouseDown);
    this.canvas.on("mouse:move", this.onPanMouseMove);
    this.canvas.on("mouse:up", this.onPanMouseUp);
  }

  /**
   * Convert keyboard event to normalized shortcut string.
   */
  private eventToShortcut(e: KeyboardEvent): string {
    const modifiers: string[] = [];

    if (e.ctrlKey) modifiers.push("ctrl");
    if (e.metaKey) modifiers.push("meta");
    if (e.shiftKey) modifiers.push("shift");
    if (e.altKey) modifiers.push("alt");

    // Sort modifiers for consistent matching
    modifiers.sort();

    // Get the key
    let key = e.key.toLowerCase();

    // Normalize some common keys
    if (e.code === "Delete") key = "delete";
    if (e.code === "Backspace") key = "backspace";
    if (e.code === "Escape") key = "escape";
    if (e.code === "Space") key = "space";

    return modifiers.length > 0 ? `${modifiers.join("+")}+${key}` : key;
  }

  private exitPanMode(): void {
    if (!this.spaceHeld) return;

    this.spaceHeld = false;
    this.canvas.defaultCursor = this.prevCursor;
    this.canvas.selection = this.prevSelection;
    this.canvas.setCursor(this.prevCursor);
    this.canvas.isDragging = false;

    this.canvas.off("mouse:down", this.onPanMouseDown);
    this.canvas.off("mouse:move", this.onPanMouseMove);
    this.canvas.off("mouse:up", this.onPanMouseUp);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Skip if typing in input/textarea
    if (this.isInputFocused(e)) return;

    // Handle space for pan mode (special case - hold behavior)
    if (e.code === "Space" && !e.repeat) {
      e.preventDefault();
      this.enterPanMode();
      return;
    }

    // Build shortcut string from event
    const shortcut = this.eventToShortcut(e);

    // Try to find and execute handler
    const registration = this.handlers.get(shortcut);
    if (registration) {
      const result = registration.handler(e);
      // If handler returns true, stop propagation
      if (result === true) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }

  // ===========================================================================
  // Keyboard Event Handling
  // ===========================================================================

  private handleKeyUp(e: KeyboardEvent): void {
    // Exit pan mode when space is released
    if (e.code === "Space") {
      this.exitPanMode();
    }
  }

  private isInputFocused(e: KeyboardEvent): boolean {
    const target = e.target as HTMLElement;
    if (!target) return false;

    const tagName = target.tagName.toUpperCase();
    if (tagName === "INPUT" || tagName === "TEXTAREA") {
      return true;
    }

    if (target.isContentEditable) {
      return true;
    }

    // Also check if we're in an IText editing mode
    const activeObject = this.canvas.getActiveObject();
    if (activeObject && "isEditing" in activeObject && activeObject.isEditing) {
      return true;
    }

    return false;
  }

  /**
   * Normalize shortcut string for consistent lookup.
   * Converts "mod" to platform-specific modifier.
   * Lowercases and sorts modifiers.
   */
  private normalizeShortcut(shortcut: string): string {
    const parts = shortcut.toLowerCase().split("+");
    const modifiers: string[] = [];
    let key = "";

    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed === "mod") {
        // Platform-aware: Cmd on Mac, Ctrl on Windows
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

    // Sort modifiers for consistent matching
    modifiers.sort();

    return modifiers.length > 0 ? `${modifiers.join("+")}+${key}` : key;
  }

  // ===========================================================================
  // Shortcut Normalization
  // ===========================================================================

  private registerDefaults(): void {
    // Delete selected objects
    this.register("delete", () => this.deleteSelected(), "shortcuts");
    this.register("backspace", () => this.deleteSelected(), "shortcuts");

    // Deselect all
    this.register("escape", () => this.deselectAll(), "shortcuts");

    // Select all
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
    if (objects.length === 0) return;

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
