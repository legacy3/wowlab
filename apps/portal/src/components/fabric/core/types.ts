export interface CanvasConfig {
  backgroundColor?: string;
  height: number;
  maxZoom?: number;
  minZoom?: number;
  width: number;
}

export interface CanvasState {
  panX: number;
  panY: number;
  zoom: number;
}

export interface ShapeOptions {
  fill?: string;
  height?: number;
  left?: number;
  stroke?: string;
  strokeWidth?: number;
  top?: number;
  width?: number;
}

export interface TextOptions {
  fill?: string;
  fontFamily?: string;
  fontSize?: number;
  left?: number;
  text?: string;
  top?: number;
}
