"use client";

import { forwardRef } from "react";
import { Text } from "react-konva";
import type Konva from "konva";
import type { TextConfig } from "konva/lib/shapes/Text";
import type { KonvaNodeEvents } from "react-konva";

type KonvaTextProps = TextConfig & KonvaNodeEvents;

export const KonvaText = forwardRef<Konva.Text, KonvaTextProps>(
  function KonvaText({ perfectDrawEnabled = false, ...props }, ref) {
    return (
      <Text ref={ref} perfectDrawEnabled={perfectDrawEnabled} {...props} />
    );
  },
);
