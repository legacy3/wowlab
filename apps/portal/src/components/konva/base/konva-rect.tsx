"use client";

import { forwardRef } from "react";
import { Rect } from "react-konva";
import type Konva from "konva";
import type { RectConfig } from "konva/lib/shapes/Rect";
import type { KonvaNodeEvents } from "react-konva";

type KonvaRectProps = RectConfig & KonvaNodeEvents;

export const KonvaRect = forwardRef<Konva.Rect, KonvaRectProps>(
  function KonvaRect({ perfectDrawEnabled = false, ...props }, ref) {
    return (
      <Rect ref={ref} perfectDrawEnabled={perfectDrawEnabled} {...props} />
    );
  },
);
