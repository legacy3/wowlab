"use client";

import { atom } from "jotai";
import type {
  Annotation,
  AnnotationLayer,
  AnnotationType,
} from "@/components/konva/annotations";

// === Tool Types ===

export type AnnotationTool = AnnotationType | "select" | null;

// === Core State Atoms ===

export const annotationsAtom = atom<Annotation[]>([]);

export const annotationLayersAtom = atom<AnnotationLayer[]>([
  { id: "default", name: "Layer 1", visible: true, locked: false },
]);

export const activeAnnotationToolAtom = atom<AnnotationTool>(null);
export const activeAnnotationColorAtom = atom<string>("#facc15");
export const activeAnnotationLayerIdAtom = atom<string>("default");
export const selectedAnnotationIdAtom = atom<string | null>(null);
export const editingTextIdAtom = atom<string | null>(null);

// === History Atoms ===

interface HistoryState {
  annotations: Annotation[];
  layers: AnnotationLayer[];
}

const MAX_HISTORY = 50;

export const annotationHistoryAtom = atom<HistoryState[]>([
  {
    annotations: [],
    layers: [{ id: "default", name: "Layer 1", visible: true, locked: false }],
  },
]);
export const annotationHistoryIndexAtom = atom<number>(0);

// === Derived Atoms ===

export const canUndoAtom = atom((get) => get(annotationHistoryIndexAtom) > 0);

export const canRedoAtom = atom(
  (get) =>
    get(annotationHistoryIndexAtom) < get(annotationHistoryAtom).length - 1,
);

export const nextAnnotationNumberAtom = atom((get) => {
  const annotations = get(annotationsAtom);
  return annotations.filter((a) => a.type === "number").length + 1;
});

export const visibleAnnotationsAtom = atom((get) => {
  const annotations = get(annotationsAtom);
  const layers = get(annotationLayersAtom);
  const visibleLayerIds = new Set(
    layers.filter((l) => l.visible).map((l) => l.id),
  );
  return annotations.filter((a) => visibleLayerIds.has(a.layerId));
});

// === Action Atoms ===

export const saveToHistoryAtom = atom(null, (get, set) => {
  const annotations = get(annotationsAtom);
  const layers = get(annotationLayersAtom);
  const history = get(annotationHistoryAtom);
  const index = get(annotationHistoryIndexAtom);

  const newHistory = history.slice(0, index + 1);
  newHistory.push({
    annotations: structuredClone(annotations),
    layers: structuredClone(layers),
  });

  if (newHistory.length > MAX_HISTORY) {
    newHistory.splice(0, newHistory.length - MAX_HISTORY);
  }

  set(annotationHistoryAtom, newHistory);
  set(annotationHistoryIndexAtom, newHistory.length - 1);
});

export const undoAnnotationAtom = atom(null, (get, set) => {
  const index = get(annotationHistoryIndexAtom);
  if (index > 0) {
    const newIndex = index - 1;
    const state = get(annotationHistoryAtom)[newIndex]!;
    set(annotationsAtom, structuredClone(state.annotations));
    set(annotationLayersAtom, structuredClone(state.layers));
    set(annotationHistoryIndexAtom, newIndex);
    set(selectedAnnotationIdAtom, null);
    set(editingTextIdAtom, null);
  }
});

export const redoAnnotationAtom = atom(null, (get, set) => {
  const history = get(annotationHistoryAtom);
  const index = get(annotationHistoryIndexAtom);
  if (index < history.length - 1) {
    const newIndex = index + 1;
    const state = history[newIndex]!;
    set(annotationsAtom, structuredClone(state.annotations));
    set(annotationLayersAtom, structuredClone(state.layers));
    set(annotationHistoryIndexAtom, newIndex);
    set(selectedAnnotationIdAtom, null);
    set(editingTextIdAtom, null);
  }
});

export const clearAnnotationsAtom = atom(null, (get, set) => {
  set(annotationsAtom, []);
  set(selectedAnnotationIdAtom, null);
  set(editingTextIdAtom, null);
  set(saveToHistoryAtom);
});
