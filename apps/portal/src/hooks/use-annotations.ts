import { useCallback, useState } from "react";

export type AnnotationType = "arrow" | "text" | "circle" | "number";

export interface BaseAnnotation {
  id: string;
  type: AnnotationType;
  color: string;
}

export interface ArrowAnnotation extends BaseAnnotation {
  type: "arrow";
  points: [number, number, number, number]; // [x1, y1, x2, y2]
}

export interface TextAnnotation extends BaseAnnotation {
  type: "text";
  x: number;
  y: number;
  content: string;
}

export interface CircleAnnotation extends BaseAnnotation {
  type: "circle";
  x: number;
  y: number;
  radius: number;
}

export interface NumberAnnotation extends BaseAnnotation {
  type: "number";
  x: number;
  y: number;
  value: number;
}

export type Annotation =
  | ArrowAnnotation
  | TextAnnotation
  | CircleAnnotation
  | NumberAnnotation;

export type ArrowAnnotationInput = Omit<ArrowAnnotation, "id" | "color">;
export type TextAnnotationInput = Omit<TextAnnotation, "id" | "color">;
export type CircleAnnotationInput = Omit<CircleAnnotation, "id" | "color">;
export type NumberAnnotationInput = Omit<NumberAnnotation, "id" | "color">;
export type AnnotationInput =
  | ArrowAnnotationInput
  | TextAnnotationInput
  | CircleAnnotationInput
  | NumberAnnotationInput;

export type AnnotationTool = AnnotationType | "select" | null;

interface UseAnnotationsReturn {
  annotations: Annotation[];
  activeTool: AnnotationTool;
  activeColor: string;
  selectedId: string | null;
  nextNumber: number;
  setActiveTool: (tool: AnnotationTool) => void;
  setActiveColor: (color: string) => void;
  addAnnotation: (annotation: AnnotationInput) => string;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  selectAnnotation: (id: string | null) => void;
  clearAnnotations: () => void;
}

export function useAnnotations(): UseAnnotationsReturn {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeTool, setActiveTool] = useState<AnnotationTool>(null);
  const [activeColor, setActiveColor] = useState("#facc15");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const nextNumber = annotations.filter((a) => a.type === "number").length + 1;

  const addAnnotation = useCallback(
    (annotation: AnnotationInput): string => {
      const id = crypto.randomUUID();
      const newAnnotation = {
        ...annotation,
        id,
        color: activeColor,
      } as Annotation;

      setAnnotations((prev) => [...prev, newAnnotation]);
      setSelectedId(id);

      return id;
    },
    [activeColor],
  );

  const updateAnnotation = useCallback(
    (id: string, updates: Partial<Annotation>) => {
      setAnnotations((prev) =>
        prev.map((a) =>
          a.id === id ? ({ ...a, ...updates } as Annotation) : a,
        ),
      );
    },
    [],
  );

  const deleteAnnotation = useCallback((id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  const selectAnnotation = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const clearAnnotations = useCallback(() => {
    setAnnotations([]);
    setSelectedId(null);
  }, []);

  return {
    annotations,
    activeTool,
    activeColor,
    selectedId,
    nextNumber,
    setActiveTool,
    setActiveColor,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    selectAnnotation,
    clearAnnotations,
  };
}
