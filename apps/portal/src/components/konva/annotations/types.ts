import type Konva from "konva";

// === Annotation Base Types ===

export type AnnotationType = "arrow" | "text" | "circle" | "number";

export interface BaseAnnotation {
  id: string;
  type: AnnotationType;
  color: string;
  layerId: string;
  strokeWidth?: number;
  opacity?: number;
  dash?: number[] | null;
}

// === Arrow Annotation ===
// Supports straight lines and curved (quadratic bezier) arrows

export interface ArrowAnnotation extends BaseAnnotation {
  type: "arrow";
  // Start and end points
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  headLength?: number;
  headWidth?: number;
  // Optional control point for curved arrows (quadratic bezier)
  // When undefined, renders as straight line
  cx?: number;
  cy?: number;
}

// === Text Annotation ===

export interface TextAnnotation extends BaseAnnotation {
  type: "text";
  x: number;
  y: number;
  width: number;
  height?: number;
  content: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  align?: "left" | "center" | "right";
  padding?: number;
  backgroundColor?: string | null;
  borderRadius?: number;
}

// === Circle Annotation ===

export interface CircleAnnotation extends BaseAnnotation {
  type: "circle";
  x: number;
  y: number;
  radius: number;
  fill?: string | null;
  fillOpacity?: number;
}

// === Number Annotation ===

export interface NumberAnnotation extends BaseAnnotation {
  type: "number";
  x: number;
  y: number;
  value: number;
  size?: number;
  fontSize?: number;
  fill?: string | null;
}

// === Union Type ===

export type Annotation =
  | ArrowAnnotation
  | TextAnnotation
  | CircleAnnotation
  | NumberAnnotation;

// === Common Props for Annotation Components ===

export interface AnnotationComponentProps<T extends Annotation> {
  annotation: T;
  isSelected: boolean;
  isEditing?: boolean;
  onSelect: () => void;
  onChange: (updates: Partial<T>, options?: { saveHistory?: boolean }) => void;
  onDelete?: () => void;
  onStartEdit?: () => void;
  onStopEdit?: () => void;
  /** The stage ref for coordinate transformations */
  stageRef?: React.RefObject<Konva.Stage>;
}

// === Layer Types ===

export interface AnnotationLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
}
