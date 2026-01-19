import type * as fabric from "fabric";

// =============================================================================
// Typed Event Emitter for Plugin Communication
// =============================================================================

export interface FabricEvents {
  "canvas:dispose": void;
  "canvas:ready": void;
  "canvas:resize": { width: number; height: number };
  "clipboard:copy": { count: number };
  "clipboard:cut": { count: number };
  "clipboard:paste": { count: number };
  "history:redo": void;
  "history:save": void;
  "history:undo": void;
  "history:update": HistoryState;
  "pan:change": { x: number; y: number };
  "selection:change": { objects: fabric.FabricObject[] };
  "zoom:change": { zoom: number };
}

export interface HistoryState {
  canRedo: boolean;
  canUndo: boolean;
  redoCount: number;
  undoCount: number;
}

type EventHandler<T = unknown> = (data: T) => void;

export class EventEmitter {
  private listeners = new Map<string, Set<EventHandler<unknown>>>();

  emit<K extends keyof FabricEvents>(
    event: K,
    ...args: FabricEvents[K] extends void ? [] : [FabricEvents[K]]
  ): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;

    const data = args[0];
    for (const handler of handlers) {
      handler(data);
    }
  }

  off<K extends keyof FabricEvents>(
    event: K,
    handler: EventHandler<FabricEvents[K]>,
  ): void {
    this.listeners.get(event)?.delete(handler as EventHandler<unknown>);
  }

  on<K extends keyof FabricEvents>(
    event: K,
    handler: EventHandler<FabricEvents[K]>,
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as EventHandler<unknown>);

    return () => this.off(event, handler);
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}
