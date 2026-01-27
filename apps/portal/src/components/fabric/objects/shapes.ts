import * as fabric from "fabric";

import type { ShapeOptions, TextOptions } from "../core/types";

export function createCircle(
  x: number,
  y: number,
  radius: number,
  options: Partial<fabric.CircleProps> = {},
): fabric.Circle {
  return new fabric.Circle({
    left: x,
    originX: "center",
    originY: "center",
    radius,
    top: y,
    ...options,
  });
}

export function createEllipse(options: ShapeOptions = {}): fabric.Ellipse {
  return new fabric.Ellipse({
    fill: options.fill ?? "transparent",
    left: options.left ?? 100,
    rx: (options.width ?? 100) / 2,
    ry: (options.height ?? 60) / 2,
    stroke: options.stroke ?? "#ef4444",
    strokeWidth: options.strokeWidth ?? 3,
    top: options.top ?? 100,
  });
}

export function createLine(
  points: [number, number, number, number],
  options: {
    stroke?: string;
    strokeWidth?: number;
    [key: string]: unknown;
  } = {},
): fabric.Line {
  return new fabric.Line(points, {
    stroke: "#ef4444",
    strokeWidth: 2,
    ...options,
  });
}

export function createRect(options: ShapeOptions = {}): fabric.Rect {
  return new fabric.Rect({
    fill: options.fill ?? "transparent",
    height: options.height ?? 60,
    left: options.left ?? 100,
    rx: 4,
    ry: 4,
    stroke: options.stroke ?? "#ef4444",
    strokeWidth: options.strokeWidth ?? 3,
    top: options.top ?? 100,
    width: options.width ?? 100,
  });
}

export function createText(options: TextOptions = {}): fabric.Textbox {
  return new fabric.Textbox(options.text ?? "Text", {
    editable: true,
    fill: options.fill ?? "#ffffff",
    fontFamily: options.fontFamily ?? "system-ui, sans-serif",
    fontSize: options.fontSize ?? 20,
    left: options.left ?? 100,
    top: options.top ?? 100,
    width: 150,
  });
}

const STATIC_DEFAULTS: Partial<fabric.FabricObjectProps> = {
  evented: false,
  hasBorders: false,
  hasControls: false,
  lockMovementX: true,
  lockMovementY: true,
  objectCaching: true,
  selectable: false,
};

export function staticCircle(
  options: fabric.TOptions<fabric.CircleProps>,
): fabric.Circle {
  return new fabric.Circle({ ...STATIC_DEFAULTS, ...options });
}

export function staticImage(
  element: HTMLImageElement,
  options: Partial<fabric.FabricObjectProps> = {},
): fabric.FabricImage {
  return new fabric.FabricImage(element, { ...STATIC_DEFAULTS, ...options });
}

export function staticLine(
  points: [number, number, number, number],
  options: Partial<fabric.FabricObjectProps> = {},
): fabric.Line {
  return new fabric.Line(points, { ...STATIC_DEFAULTS, ...options });
}

export function staticPolygon(
  points: fabric.XY[],
  options: Partial<fabric.FabricObjectProps> = {},
): fabric.Polygon {
  return new fabric.Polygon(points, { ...STATIC_DEFAULTS, ...options });
}

export function staticRect(
  options: fabric.TOptions<fabric.RectProps>,
): fabric.Rect {
  return new fabric.Rect({ ...STATIC_DEFAULTS, ...options });
}

export function staticText(
  text: string,
  options: fabric.TOptions<fabric.TextProps>,
): fabric.Text {
  return new fabric.Text(text, { ...STATIC_DEFAULTS, ...options });
}
