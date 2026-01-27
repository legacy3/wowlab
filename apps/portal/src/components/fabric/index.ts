export { batchAdd, batchRemove, preloadImages } from "./batch";

export { CanvasController } from "./core/controller";
export {
  EventEmitter,
  type FabricEvents,
  type HistoryState,
} from "./core/events";
export { type FabricPlugin, PluginRegistry } from "./core/plugin";
export { THEME, type Theme } from "./core/theme";

export type {
  CanvasConfig,
  CanvasState,
  ShapeOptions,
  TextOptions,
} from "./core/types";

export {
  useCanvas,
  type UseCanvasOptions,
  type UseCanvasReturn,
} from "./hooks/use-canvas";
export {
  useCanvasContainer,
  type UseCanvasContainerReturn,
} from "./hooks/use-canvas-container";

export {
  createCircle,
  createEllipse,
  createLine,
  createRect,
  createText,
  staticCircle,
  staticImage,
  staticLine,
  staticPolygon,
  staticRect,
  staticText,
} from "./objects/shapes";

export {
  ClipboardPlugin,
  type ControlsConfig,
  ControlsPlugin,
  type GuidelinesConfig,
  GuidelinesPlugin,
  HistoryPlugin,
  type HistoryPluginConfig,
  type InteractionMode,
  InteractionPlugin,
  type InteractionPluginConfig,
  type ShortcutHandler,
  type ShortcutRegistration,
  ShortcutsPlugin,
  ZoomPlugin,
  type ZoomPluginConfig,
} from "./plugins";

export { Toolbar } from "./ui/toolbar";

export type { ToolbarProps } from "./ui/toolbar";
