import * as fabric from "fabric";

import type { CanvasController } from "../core/controller";
import type { FabricPlugin } from "../core/plugin";

export interface AddObjectOptions {
  centered?: boolean;
  id?: string;
  select?: boolean;
}

export interface ObjectsPluginConfig {
  propertiesToInclude?: string[];
}

export interface TrackedObject extends fabric.FabricObject {
  id?: string;
}

export class ObjectsPlugin implements FabricPlugin {
  readonly name = "objects";

  private canvas!: fabric.Canvas;
  private config: Required<ObjectsPluginConfig>;
  private controller!: CanvasController;
  private handleObjectAdded = (e: { target: fabric.FabricObject }): void => {
    this.indexObject(e.target as TrackedObject);
  };

  private handleObjectRemoved = (e: { target: fabric.FabricObject }): void => {
    const obj = e.target as TrackedObject;
    if (obj.id) {
      this.objectMap.delete(obj.id);
    }
  };

  private objectMap = new Map<string, TrackedObject>();

  constructor(config: ObjectsPluginConfig = {}) {
    this.config = {
      propertiesToInclude: config.propertiesToInclude ?? ["id"],
    };
  }

  add(obj: TrackedObject, options: AddObjectOptions = {}): TrackedObject {
    const { centered = false, id = generateId(), select = true } = options;

    obj.id = id;

    if (centered) {
      const center = this.canvas.getCenterPoint();
      obj.set({
        left: center.x - (obj.width ?? 0) / 2,
        top: center.y - (obj.height ?? 0) / 2,
      });
    }

    this.canvas.add(obj);

    if (select) {
      this.canvas.setActiveObject(obj);
    }

    this.canvas.requestRenderAll();
    this.controller.events.emit("object:add", { object: obj });

    return obj;
  }

  all(): TrackedObject[] {
    return this.canvas.getObjects() as TrackedObject[];
  }

  bringForward(): void {
    const active = this.canvas.getActiveObject();
    if (!active) {
      return;
    }

    if (active.type === "activeSelection") {
      const selection = active as fabric.ActiveSelection;
      for (const obj of selection.getObjects()) {
        this.canvas.bringObjectForward(obj);
      }
    } else {
      this.canvas.bringObjectForward(active);
    }

    this.canvas.requestRenderAll();
    this.controller.events.emit("objects:reorder");
  }

  bringToFront(): void {
    const active = this.canvas.getActiveObject();
    if (!active) {
      return;
    }

    if (active.type === "activeSelection") {
      const selection = active as fabric.ActiveSelection;
      for (const obj of selection.getObjects()) {
        this.canvas.bringObjectToFront(obj);
      }
    } else {
      this.canvas.bringObjectToFront(active);
    }

    this.canvas.requestRenderAll();
    this.controller.events.emit("objects:reorder");
  }

  clear(): void {
    this.canvas.clear();
    this.objectMap.clear();
    this.controller.events.emit("objects:clear");
  }

  destroy(): void {
    this.canvas.off("object:added", this.handleObjectAdded);
    this.canvas.off("object:removed", this.handleObjectRemoved);
    this.objectMap.clear();
  }

  duplicate(): TrackedObject[] {
    const active = this.canvas.getActiveObject();
    if (!active) {
      return [];
    }

    const duplicated: TrackedObject[] = [];

    active.clone().then((cloned) => {
      this.canvas.discardActiveObject();

      if (cloned.type === "activeSelection") {
        const selection = cloned as fabric.ActiveSelection;
        for (const obj of selection.getObjects()) {
          const trackedObj = obj as TrackedObject;
          trackedObj.id = generateId();
          trackedObj.set({
            left: (trackedObj.left ?? 0) + 20,
            top: (trackedObj.top ?? 0) + 20,
          });
          this.canvas.add(trackedObj);
          duplicated.push(trackedObj);
        }
      } else {
        const trackedObj = cloned as TrackedObject;
        trackedObj.id = generateId();
        trackedObj.set({
          left: (trackedObj.left ?? 0) + 20,
          top: (trackedObj.top ?? 0) + 20,
        });
        this.canvas.add(trackedObj);
        duplicated.push(trackedObj);
        this.canvas.setActiveObject(trackedObj);
      }

      this.canvas.requestRenderAll();
      this.controller.events.emit("objects:duplicate", { objects: duplicated });
    });

    return duplicated;
  }

  exportJSON(): object {
    return this.canvas.toJSON();
  }

  findById(id: string): TrackedObject | undefined {
    return this.objectMap.get(id);
  }

  getSelected(): TrackedObject[] {
    return this.canvas.getActiveObjects() as TrackedObject[];
  }

  has(id: string): boolean {
    return this.objectMap.has(id);
  }

  async importJSON(json: string | object): Promise<void> {
    const data = typeof json === "string" ? JSON.parse(json) : json;

    await this.canvas.loadFromJSON(data);

    this.objectMap.clear();
    for (const obj of this.canvas.getObjects()) {
      this.indexObject(obj as TrackedObject);
    }

    this.canvas.requestRenderAll();
    this.controller.events.emit("objects:import");
  }

  init(canvas: fabric.Canvas, controller: CanvasController): void {
    this.canvas = canvas;
    this.controller = controller;

    this.canvas.on("object:added", this.handleObjectAdded);
    this.canvas.on("object:removed", this.handleObjectRemoved);

    for (const obj of this.canvas.getObjects()) {
      this.indexObject(obj as TrackedObject);
    }
  }

  remove(id: string): boolean {
    const obj = this.objectMap.get(id);
    if (!obj) {
      return false;
    }

    this.canvas.remove(obj);
    this.canvas.requestRenderAll();

    return true;
  }

  removeSelected(): TrackedObject[] {
    const active = this.canvas.getActiveObjects() as TrackedObject[];
    if (active.length === 0) {
      return [];
    }

    for (const obj of active) {
      this.canvas.remove(obj);
    }

    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
    this.controller.events.emit("objects:remove", { objects: active });

    return active;
  }

  selectAll(): void {
    const objects = this.canvas.getObjects();
    if (objects.length === 0) {
      return;
    }

    const selection = new fabric.ActiveSelection(objects, {
      canvas: this.canvas,
    });
    this.canvas.setActiveObject(selection);
    this.canvas.requestRenderAll();
  }

  selectById(id: string): boolean {
    const obj = this.objectMap.get(id);
    if (!obj) {
      return false;
    }

    this.canvas.setActiveObject(obj);
    this.canvas.requestRenderAll();

    return true;
  }

  sendBackward(): void {
    const active = this.canvas.getActiveObject();
    if (!active) {
      return;
    }

    if (active.type === "activeSelection") {
      const selection = active as fabric.ActiveSelection;
      for (const obj of selection.getObjects()) {
        this.canvas.sendObjectBackwards(obj);
      }
    } else {
      this.canvas.sendObjectBackwards(active);
    }

    this.canvas.requestRenderAll();
    this.controller.events.emit("objects:reorder");
  }

  sendToBack(): void {
    const active = this.canvas.getActiveObject();
    if (!active) {
      return;
    }

    if (active.type === "activeSelection") {
      const selection = active as fabric.ActiveSelection;
      for (const obj of selection.getObjects()) {
        this.canvas.sendObjectToBack(obj);
      }
    } else {
      this.canvas.sendObjectToBack(active);
    }

    this.canvas.requestRenderAll();
    this.controller.events.emit("objects:reorder");
  }

  private indexObject(obj: TrackedObject): void {
    if (!obj.id) {
      obj.id = generateId();
    }

    this.objectMap.set(obj.id, obj);
  }
}

// TODO This should use useID from react
function generateId(): string {
  return `obj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
