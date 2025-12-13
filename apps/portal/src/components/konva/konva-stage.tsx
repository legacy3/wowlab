"use client";

import { Stage } from "react-konva";
import type { StageProps } from "react-konva";

export function KonvaStage(props: StageProps) {
  return <Stage {...props} />;
}
