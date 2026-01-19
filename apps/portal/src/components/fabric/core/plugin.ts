import type * as fabric from "fabric";

import type { CanvasController } from "./controller";

// =============================================================================
// Plugin Interface
// =============================================================================

export interface FabricPlugin {
  destroy(): void;
  readonly hotkeys?: string[];

  init(canvas: fabric.Canvas, controller: CanvasController): void;
  readonly name: string;
}

// =============================================================================
// Plugin Registry
// =============================================================================

export class PluginRegistry {
  private plugins = new Map<string, FabricPlugin>();

  destroy(): void {
    for (const plugin of this.plugins.values()) {
      plugin.destroy();
    }
    this.plugins.clear();
  }

  get<T extends FabricPlugin>(name: string): T | undefined {
    return this.plugins.get(name) as T | undefined;
  }

  getAll(): FabricPlugin[] {
    return Array.from(this.plugins.values());
  }

  register(
    plugin: FabricPlugin,
    canvas: fabric.Canvas,
    controller: CanvasController,
  ): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin "${plugin.name}" already registered, skipping`);
      return;
    }

    plugin.init(canvas, controller);
    this.plugins.set(plugin.name, plugin);
  }

  unregister(name: string): void {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.destroy();
      this.plugins.delete(name);
    }
  }
}
