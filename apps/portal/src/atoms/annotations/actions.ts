"use client";

import { atom } from "jotai";
import type {
  Annotation,
  AnnotationLayer,
} from "@/components/konva/annotations";
import { TEXT_DEFAULT_WIDTH } from "@/components/konva/annotations/constants";
import {
  annotationsAtom,
  annotationLayersAtom,
  annotationHistoryAtom,
  annotationHistoryIndexAtom,
  annotationStyleDefaultsAtom,
  activeAnnotationLayerIdAtom,
  activeAnnotationToolAtom,
  selectedAnnotationIdAtom,
  editingTextIdAtom,
  saveToHistoryAtom,
  DEFAULT_ANNOTATION_STYLE_DEFAULTS,
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

interface AnnotationLookup {
  annotation: Annotation | undefined;
  layer: AnnotationLayer | undefined;
}

function getAnnotationWithLayer(
  id: string,
  annotations: Annotation[],
  layers: AnnotationLayer[],
): AnnotationLookup {
  const annotation = annotations.find((a) => a.id === id);
  const layer = layers.find((l) => l.id === annotation?.layerId);

  return { annotation, layer };
}

export const addAnnotationAtom = atom(
  null,
  (get, set, input: AnnotationInput & { saveHistory?: boolean }) => {
    const id = crypto.randomUUID();
    const styleDefaults = get(annotationStyleDefaultsAtom);
    const layerId = get(activeAnnotationLayerIdAtom);
    const layers = get(annotationLayersAtom);
    const activeLayer = layers.find((layer) => layer.id === layerId);

    if (!activeLayer || activeLayer.locked || !activeLayer.visible) {
      return "";
    }
    const { saveHistory = true, ...annotationData } = input;

    const baseStyle = {
      color: styleDefaults.color,
      strokeWidth: styleDefaults.strokeWidth,
      opacity: styleDefaults.opacity,
      dash: styleDefaults.dash ?? null,
    };

    const newAnnotation = {
      ...annotationData,
      ...baseStyle,
      ...(annotationData.type === "arrow"
        ? {
            headLength: styleDefaults.arrowHeadLength,
            headWidth: styleDefaults.arrowHeadWidth,
          }
        : {}),
      ...(annotationData.type === "circle"
        ? {
            fill: styleDefaults.fill ?? null,
          }
        : {}),
      ...(annotationData.type === "text"
        ? {
            fontSize: styleDefaults.fontSize,
            fontWeight: styleDefaults.fontWeight,
            align: styleDefaults.textAlign,
            backgroundColor: styleDefaults.textBackground ?? null,
            width:
              "width" in annotationData && annotationData.width
                ? annotationData.width
                : TEXT_DEFAULT_WIDTH,
          }
        : {}),
      ...(annotationData.type === "number"
        ? {
            size: styleDefaults.numberSize,
            fontSize: styleDefaults.numberFontSize,
            fill: styleDefaults.fill ?? null,
          }
        : {}),
      id,
      layerId,
    } as Annotation;

    set(annotationsAtom, (prev) => [...prev, newAnnotation]);
    set(selectedAnnotationIdAtom, id);

    if (saveHistory) {
      set(saveToHistoryAtom);
    }

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
    const { annotation, layer } = getAnnotationWithLayer(
      id,
      get(annotationsAtom),
      get(annotationLayersAtom),
    );

    if (!annotation || layer?.locked || layer?.visible === false) {
      return;
    }

    set(annotationsAtom, (prev) =>
      prev.map((a) => (a.id === id ? ({ ...a, ...updates } as Annotation) : a)),
    );

    if (saveHistory) {
      set(saveToHistoryAtom);
    }
  },
);

export const deleteAnnotationAtom = atom(null, (get, set, id: string) => {
  const { annotation, layer } = getAnnotationWithLayer(
    id,
    get(annotationsAtom),
    get(annotationLayersAtom),
  );

  if (!annotation || layer?.locked) {
    return;
  }

  set(annotationsAtom, (prev) => prev.filter((a) => a.id !== id));

  if (get(selectedAnnotationIdAtom) === id) {
    set(selectedAnnotationIdAtom, null);
  }

  if (get(editingTextIdAtom) === id) {
    set(editingTextIdAtom, null);
  }

  set(saveToHistoryAtom);
});

export const selectAnnotationAtom = atom(
  null,
  (get, set, id: string | null) => {
    if (id) {
      const { annotation, layer } = getAnnotationWithLayer(
        id,
        get(annotationsAtom),
        get(annotationLayersAtom),
      );

      if (!annotation || layer?.visible === false) {
        return;
      }
    }

    set(selectedAnnotationIdAtom, id);

    if (get(editingTextIdAtom) !== id) {
      set(editingTextIdAtom, null);
    }
  },
);

export const startEditingTextAtom = atom(null, (get, set, id: string) => {
  const { annotation, layer } = getAnnotationWithLayer(
    id,
    get(annotationsAtom),
    get(annotationLayersAtom),
  );

  if (!annotation || layer?.locked || layer?.visible === false) {
    return;
  }

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
  const target = layers.find((layer) => layer.id === id);

  if (target?.locked) {
    return;
  }

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

export const toggleLayerVisibilityAtom = atom(null, (get, set, id: string) => {
  const activeLayerId = get(activeAnnotationLayerIdAtom);
  const selectedId = get(selectedAnnotationIdAtom);
  const annotations = get(annotationsAtom);
  const selected = annotations.find((a) => a.id === selectedId);

  let nextLayers: AnnotationLayer[] = [];
  let didHideActive = false;
  let didHideSelected = false;

  set(annotationLayersAtom, (prev) => {
    nextLayers = prev.map((l) => {
      if (l.id !== id) {
        return l;
      }

      const next = { ...l, visible: !l.visible };
      if (l.id === activeLayerId && !next.visible) {
        didHideActive = true;
      }

      if (selected && selected.layerId === l.id && !next.visible) {
        didHideSelected = true;
      }

      return next;
    });

    return nextLayers;
  });

  if (didHideActive) {
    const nextActive =
      nextLayers.find((layer) => layer.visible)?.id ?? "default";

    set(activeAnnotationLayerIdAtom, nextActive);
  }

  if (didHideActive || didHideSelected) {
    set(selectedAnnotationIdAtom, null);
    set(editingTextIdAtom, null);
  }
});

export const toggleLayerLockAtom = atom(null, (_, set, id: string) => {
  set(annotationLayersAtom, (prev) =>
    prev.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l)),
  );
});

export const showAllLayersAtom = atom(null, (get, set) => {
  const layers = get(annotationLayersAtom);
  if (layers.every((layer) => layer.visible)) {
    return;
  }

  set(annotationLayersAtom, (prev) =>
    prev.map((layer) => ({ ...layer, visible: true })),
  );
});

export const hideAllLayersAtom = atom(null, (get, set) => {
  const layers = get(annotationLayersAtom);
  if (layers.every((layer) => !layer.visible)) {
    return;
  }

  set(annotationLayersAtom, (prev) =>
    prev.map((layer) => ({ ...layer, visible: false })),
  );
  set(selectedAnnotationIdAtom, null);
  set(editingTextIdAtom, null);
});

export const clearLayerAtom = atom(null, (get, set, layerId: string) => {
  const layers = get(annotationLayersAtom);
  const target = layers.find((layer) => layer.id === layerId);

  if (target?.locked) {
    return;
  }

  set(annotationsAtom, (prev) => prev.filter((a) => a.layerId !== layerId));

  const selectedId = get(selectedAnnotationIdAtom);
  const annotations = get(annotationsAtom);
  const selected = annotations.find((a) => a.id === selectedId);

  if (selected?.layerId === layerId) {
    set(selectedAnnotationIdAtom, null);
  }

  set(saveToHistoryAtom);
});

export const resetAnnotationsAtom = atom(null, (_, set) => {
  const defaultLayers: AnnotationLayer[] = [
    { id: "default", name: "Layer 1", visible: true, locked: false },
  ];

  set(annotationsAtom, []);
  set(annotationLayersAtom, defaultLayers);
  set(activeAnnotationLayerIdAtom, "default");
  set(activeAnnotationToolAtom, null);
  set(selectedAnnotationIdAtom, null);
  set(editingTextIdAtom, null);
  set(annotationHistoryAtom, [{ annotations: [], layers: defaultLayers }]);
  set(annotationHistoryIndexAtom, 0);
  set(annotationStyleDefaultsAtom, { ...DEFAULT_ANNOTATION_STYLE_DEFAULTS });
});
