import * as fabric from "fabric";

import type { CanvasController } from "../core/controller";
import type { FabricPlugin } from "../core/plugin";
import type { ShortcutsPlugin } from "./shortcuts";

interface ClipboardData {
  objects: object[];
  timestamp: number;
}

export class ClipboardPlugin implements FabricPlugin {
  readonly hotkeys = ["mod+c", "mod+x", "mod+v", "mod+d"];
  readonly name = "clipboard";

  private canvas!: fabric.Canvas;
  private clipboard: ClipboardData | null = null;

  private controller!: CanvasController;
  private pasteCount = 0;
  private pasteOffset = 10;

  clear(): void {
    this.clipboard = null;
    this.pasteCount = 0;
  }

  async copy(): Promise<void> {
    const activeObjects = this.canvas.getActiveObjects();
    if (activeObjects.length === 0) {
      return;
    }

    const serialized = await this.serializeObjects(activeObjects);

    this.clipboard = {
      objects: serialized,
      timestamp: Date.now(),
    };
    this.pasteCount = 0;

    this.controller.events.emit("clipboard:copy", {
      count: activeObjects.length,
    });
  }

  async cut(): Promise<void> {
    const activeObjects = this.canvas.getActiveObjects();
    if (activeObjects.length === 0) {
      return;
    }

    await this.copy();
    this.controller.deleteSelected();

    this.controller.events.emit("clipboard:cut", {
      count: activeObjects.length,
    });
  }

  destroy(): void {
    this.unregisterShortcuts();
    this.clipboard = null;
    this.pasteCount = 0;
  }

  async duplicate(): Promise<void> {
    const activeObjects = this.canvas.getActiveObjects();
    if (activeObjects.length === 0) {
      return;
    }

    // Store current clipboard state
    const prevClipboard = this.clipboard;
    const prevPasteCount = this.pasteCount;

    // Copy and paste
    await this.copy();
    await this.paste();

    // Restore previous clipboard (duplicate shouldn't affect clipboard)
    this.clipboard = prevClipboard;
    this.pasteCount = prevPasteCount;
  }

  hasContent(): boolean {
    return this.clipboard !== null && this.clipboard.objects.length > 0;
  }

  init(canvas: fabric.Canvas, controller: CanvasController): void {
    this.canvas = canvas;
    this.controller = controller;

    this.registerShortcuts();
  }

  async paste(): Promise<void> {
    if (!this.clipboard || this.clipboard.objects.length === 0) {
      return;
    }

    this.pasteCount++;
    const offset = this.pasteCount * this.pasteOffset;

    const objects = await this.deserializeObjects(this.clipboard.objects);

    // Apply offset and add to canvas
    const pastedObjects: fabric.FabricObject[] = [];

    for (const obj of objects) {
      // Generate new ID
      (obj as { id?: string } & fabric.FabricObject).id = this.generateId();

      // Apply offset
      obj.set({
        left: (obj.left ?? 0) + offset,
        top: (obj.top ?? 0) + offset,
      });

      this.canvas.add(obj);
      pastedObjects.push(obj);
    }

    // Select pasted objects
    this.selectObjects(pastedObjects);
    this.canvas.requestRenderAll();

    this.controller.events.emit("clipboard:paste", {
      count: pastedObjects.length,
    });
  }

  private async deserializeObjects(
    data: object[],
  ): Promise<fabric.FabricObject[]> {
    const objects = await fabric.util.enlivenObjects(data, {
      reviver: (_obj, fabricObj) => fabricObj,
    });
    return objects as fabric.FabricObject[];
  }

  private generateId(): string {
    return `obj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  private registerShortcuts(): void {
    const shortcuts = this.controller.plugins.get<ShortcutsPlugin>("shortcuts");
    if (!shortcuts) {
      return;
    }

    shortcuts.register(
      "mod+c",
      (e) => {
        e.preventDefault();
        void this.copy();
        return true;
      },
      this.name,
    );

    shortcuts.register(
      "mod+x",
      (e) => {
        e.preventDefault();
        void this.cut();
        return true;
      },
      this.name,
    );

    shortcuts.register(
      "mod+v",
      (e) => {
        e.preventDefault();
        void this.paste();
        return true;
      },
      this.name,
    );

    shortcuts.register(
      "mod+d",
      (e) => {
        e.preventDefault();
        void this.duplicate();
        return true;
      },
      this.name,
    );
  }

  private selectObjects(objects: fabric.FabricObject[]): void {
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
  }

  private async serializeObjects(
    objects: fabric.FabricObject[],
  ): Promise<object[]> {
    const serialized: object[] = [];

    for (const obj of objects) {
      // Clone to get a clean serialized version
      const cloned = await obj.clone();
      serialized.push(cloned.toObject(["id"]));
    }

    return serialized;
  }

  private unregisterShortcuts(): void {
    const shortcuts = this.controller.plugins.get<ShortcutsPlugin>("shortcuts");
    if (!shortcuts) {
      return;
    }

    shortcuts.unregister("mod+c");
    shortcuts.unregister("mod+x");
    shortcuts.unregister("mod+v");
    shortcuts.unregister("mod+d");
  }
}
