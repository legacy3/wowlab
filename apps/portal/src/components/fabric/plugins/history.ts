import type * as fabric from "fabric";

import type { CanvasController } from "../core/controller";
import type { HistoryState } from "../core/events";
import type { FabricPlugin } from "../core/plugin";
import type { ShortcutsPlugin } from "./shortcuts";

export interface HistoryPluginConfig {
  maxLength?: number;
  throttleDelay?: number;
}

export class HistoryPlugin implements FabricPlugin {
  readonly hotkeys = ["mod+z", "mod+shift+z"];
  readonly name = "history";

  private boundHandlers: {
    onModified: () => void;
    onAdded: () => void;
    onRemoved: () => void;
  } | null = null;
  private canvas!: fabric.Canvas;

  private controller!: CanvasController;
  private currentIndex = 0;
  private isProcessing = false;
  private lastSaveTime = 0;

  private maxLength: number;
  private pendingSave: ReturnType<typeof setTimeout> | null = null;
  private stack: string[] = [];

  private throttleDelay: number;

  constructor(config: HistoryPluginConfig = {}) {
    this.maxLength = config.maxLength ?? 50;
    this.throttleDelay = config.throttleDelay ?? 100;
  }

  get canRedo(): boolean {
    return this.currentIndex < this.stack.length;
  }

  get canUndo(): boolean {
    return this.currentIndex > 1;
  }

  get redoCount(): number {
    return this.stack.length - this.currentIndex;
  }

  get undoCount(): number {
    return this.currentIndex - 1;
  }

  clear(): void {
    const currentState = this.serializeCanvas();
    this.stack = [currentState];
    this.currentIndex = 1;
    this.emitUpdate();
  }

  destroy(): void {
    if (this.boundHandlers) {
      this.canvas.off("object:modified", this.boundHandlers.onModified);
      this.canvas.off("object:added", this.boundHandlers.onAdded);
      this.canvas.off("object:removed", this.boundHandlers.onRemoved);
      this.boundHandlers = null;
    }

    // Unregister shortcuts
    this.unregisterShortcuts();

    if (this.pendingSave) {
      clearTimeout(this.pendingSave);
      this.pendingSave = null;
    }

    this.stack = [];
    this.currentIndex = 0;
  }

  init(canvas: fabric.Canvas, controller: CanvasController): void {
    this.canvas = canvas;
    this.controller = controller;

    // Create bound handlers for cleanup
    this.boundHandlers = {
      onAdded: () => this.saveState(),
      onModified: () => this.saveState(),
      onRemoved: () => this.saveState(),
    };

    // Listen to object changes
    this.canvas.on("object:modified", this.boundHandlers.onModified);
    this.canvas.on("object:added", this.boundHandlers.onAdded);
    this.canvas.on("object:removed", this.boundHandlers.onRemoved);

    // Register shortcuts with ShortcutsPlugin if available
    this.registerShortcuts();

    // Save initial state
    this.saveStateImmediate();
  }

  redo(): void {
    if (!this.canRedo || this.isProcessing) {
      return;
    }

    const state = this.stack[this.currentIndex];
    if (state) {
      this.loadState(state, "history:redo");
      this.currentIndex++;
    }
  }

  undo(): void {
    if (!this.canUndo || this.isProcessing) {
      return;
    }

    this.currentIndex--;
    const state = this.stack[this.currentIndex - 1];
    if (state) {
      this.loadState(state, "history:undo");
    }
  }

  private emitUpdate(): void {
    const state: HistoryState = {
      canRedo: this.canRedo,
      canUndo: this.canUndo,
      redoCount: this.redoCount,
      undoCount: this.undoCount,
    };
    this.controller.events.emit("history:update", state);
  }

  private loadState(
    state: string,
    eventName: "history:undo" | "history:redo",
  ): void {
    this.isProcessing = true;

    this.canvas.loadFromJSON(state).then(() => {
      this.canvas.requestRenderAll();
      this.isProcessing = false;
      this.emitUpdate();
      this.controller.events.emit(eventName);
    });
  }

  private registerShortcuts(): void {
    const shortcuts = this.controller.plugins.get<ShortcutsPlugin>("shortcuts");
    if (!shortcuts) {
      return;
    }

    shortcuts.register(
      "mod+z",
      (e) => {
        e.preventDefault();
        this.undo();
      },
      this.name,
    );

    shortcuts.register(
      "mod+shift+z",
      (e) => {
        e.preventDefault();
        this.redo();
      },
      this.name,
    );
  }

  private saveState(): void {
    // Don't save during undo/redo operations
    if (this.isProcessing) {
      return;
    }

    const now = Date.now();
    const timeSinceLastSave = now - this.lastSaveTime;

    // Clear any pending save
    if (this.pendingSave) {
      clearTimeout(this.pendingSave);
      this.pendingSave = null;
    }

    // Throttle saves
    if (timeSinceLastSave < this.throttleDelay) {
      this.pendingSave = setTimeout(() => {
        this.saveStateImmediate();
        this.pendingSave = null;
      }, this.throttleDelay - timeSinceLastSave);
      return;
    }

    this.saveStateImmediate();
  }

  private saveStateImmediate(): void {
    if (this.isProcessing) {
      return;
    }

    const state = this.serializeCanvas();

    // Clear redo history when new change is made
    if (this.currentIndex < this.stack.length) {
      this.stack = this.stack.slice(0, this.currentIndex);
    }

    this.stack.push(state);

    // Truncate if max length exceeded
    if (this.stack.length > this.maxLength) {
      this.stack.shift();
    } else {
      this.currentIndex++;
    }

    this.lastSaveTime = Date.now();
    this.emitUpdate();
    this.controller.events.emit("history:save");
  }

  private serializeCanvas(): string {
    return JSON.stringify(this.canvas.toJSON());
  }

  private unregisterShortcuts(): void {
    const shortcuts = this.controller.plugins.get<ShortcutsPlugin>("shortcuts");
    if (!shortcuts) {
      return;
    }

    shortcuts.unregister("mod+z");
    shortcuts.unregister("mod+shift+z");
  }
}
