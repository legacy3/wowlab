"use client";

import { atom } from "jotai";
import type {
  Annotation,
  AnnotationLayer,
} from "@/components/konva/annotations";
import {
  annotationsAtom,
  annotationLayersAtom,
  activeAnnotationColorAtom,
  activeAnnotationLayerIdAtom,
  activeAnnotationToolAtom,
  selectedAnnotationIdAtom,
  editingTextIdAtom,
  saveToHistoryAtom,
} from "./state";

type AnnotationInputBase<T extends Annotation["type"]> = Omit<
  Extract<Annotation, { type: T }>,
  "id" | "color" | "layerId"
>;

export type AnnotationInput =
  | ({ type: "arrow" } & AnnotationInputBase<"arrow">)
  | ({ type: "text" } & AnnotationInputBase<"text">)
  | ({ type: "circle" } & AnnotationInputBase<"circle">)
  | ({ type: "number" } & AnnotationInputBase<"number">);

export const addAnnotationAtom = atom(
  null,
  (get, set, input: AnnotationInput & { autoSelect?: boolean }) => {
    const id = crypto.randomUUID();
    const color = get(activeAnnotationColorAtom);
    const layerId = get(activeAnnotationLayerIdAtom);
    const { autoSelect = true, ...annotationData } = input;

    const newAnnotation = {
      ...annotationData,
      id,
      color,
      layerId,
    } as Annotation;

    set(annotationsAtom, (prev) => [...prev, newAnnotation]);
    set(selectedAnnotationIdAtom, id);

    if (autoSelect) {
      set(activeAnnotationToolAtom, "select");
    }

    set(saveToHistoryAtom);

    return id;
  },
);

export const updateAnnotationAtom = atom(
  null,
  (
    get,
    set,
    {
      id,
      updates,
      saveHistory = true,
    }: { id: string; updates: Partial<Annotation>; saveHistory?: boolean },
  ) => {
    set(annotationsAtom, (prev) =>
      prev.map((a) => (a.id === id ? ({ ...a, ...updates } as Annotation) : a)),
    );

    if (saveHistory) {
      set(saveToHistoryAtom);
    }
  },
);

export const deleteAnnotationAtom = atom(null, (get, set, id: string) => {
  set(annotationsAtom, (prev) => prev.filter((a) => a.id !== id));

  const selectedId = get(selectedAnnotationIdAtom);
  if (selectedId === id) {
    set(selectedAnnotationIdAtom, null);
  }

  const editingId = get(editingTextIdAtom);
  if (editingId === id) {
    set(editingTextIdAtom, null);
  }

  set(saveToHistoryAtom);
});

export const selectAnnotationAtom = atom(
  null,
  (get, set, id: string | null) => {
    set(selectedAnnotationIdAtom, id);
    const editingId = get(editingTextIdAtom);

    if (editingId !== id) {
      set(editingTextIdAtom, null);
    }
  },
);

export const startEditingTextAtom = atom(null, (_, set, id: string) => {
  set(editingTextIdAtom, id);
  set(selectedAnnotationIdAtom, id);
});

export const stopEditingTextAtom = atom(null, (_, set) => {
  set(editingTextIdAtom, null);
});

// === Layer Actions ===

export const addLayerAtom = atom(null, (get, set, name?: string) => {
  const id = crypto.randomUUID();
  const layers = get(annotationLayersAtom);
  const layerName = name || `Layer ${layers.length + 1}`;

  const newLayer: AnnotationLayer = {
    id,
    name: layerName,
    visible: true,
    locked: false,
  };

  set(annotationLayersAtom, (prev) => [...prev, newLayer]);
  set(activeAnnotationLayerIdAtom, id);
  set(saveToHistoryAtom);

  return id;
});

export const deleteLayerAtom = atom(null, (get, set, id: string) => {
  const layers = get(annotationLayersAtom);
  if (layers.length <= 1) {
    return;
  }

  set(annotationLayersAtom, (prev) => prev.filter((l) => l.id !== id));
  set(annotationsAtom, (prev) => prev.filter((a) => a.layerId !== id));

  const activeLayerId = get(activeAnnotationLayerIdAtom);
  if (activeLayerId === id) {
    const remaining = layers.filter((l) => l.id !== id);
    set(activeAnnotationLayerIdAtom, remaining[0]?.id ?? "default");
  }

  const selectedId = get(selectedAnnotationIdAtom);
  const annotations = get(annotationsAtom);
  const selected = annotations.find((a) => a.id === selectedId);

  if (selected?.layerId === id) {
    set(selectedAnnotationIdAtom, null);
  }

  set(saveToHistoryAtom);
});

export const renameLayerAtom = atom(
  null,
  (_, set, { id, name }: { id: string; name: string }) => {
    set(annotationLayersAtom, (prev) =>
      prev.map((l) => (l.id === id ? { ...l, name } : l)),
    );

    set(saveToHistoryAtom);
  },
);

export const toggleLayerVisibilityAtom = atom(null, (_, set, id: string) => {
  set(annotationLayersAtom, (prev) =>
    prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)),
  );
});

export const toggleLayerLockAtom = atom(null, (_, set, id: string) => {
  set(annotationLayersAtom, (prev) =>
    prev.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l)),
  );
});

export const clearLayerAtom = atom(null, (get, set, layerId: string) => {
  set(annotationsAtom, (prev) => prev.filter((a) => a.layerId !== layerId));

  const selectedId = get(selectedAnnotationIdAtom);
  const annotations = get(annotationsAtom);
  const selected = annotations.find((a) => a.id === selectedId);

  if (selected?.layerId === layerId) {
    set(selectedAnnotationIdAtom, null);
  }

  set(saveToHistoryAtom);
});
