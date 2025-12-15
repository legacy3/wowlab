"use client";

import { forwardRef } from "react";
import { Line } from "react-konva";
import type Konva from "konva";
import type { LineConfig } from "konva/lib/shapes/Line";
import type { KonvaNodeEvents } from "react-konva";

type KonvaLineProps = LineConfig & KonvaNodeEvents;

export const KonvaLine = forwardRef<Konva.Line, KonvaLineProps>(
  function KonvaLine({ perfectDrawEnabled = false, ...props }, ref) {
    return (
      <Line ref={ref} perfectDrawEnabled={perfectDrawEnabled} {...props} />
    );
  },
);
