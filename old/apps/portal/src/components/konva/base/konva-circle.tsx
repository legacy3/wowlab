"use client";

import { forwardRef } from "react";
import { Circle } from "react-konva";
import type Konva from "konva";
import type { CircleConfig } from "konva/lib/shapes/Circle";
import type { KonvaNodeEvents } from "react-konva";

type KonvaCircleProps = CircleConfig & KonvaNodeEvents;

export const KonvaCircle = forwardRef<Konva.Circle, KonvaCircleProps>(
  function KonvaCircle({ perfectDrawEnabled = false, ...props }, ref) {
    return (
      <Circle ref={ref} perfectDrawEnabled={perfectDrawEnabled} {...props} />
    );
  },
);
