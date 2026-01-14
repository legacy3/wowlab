"use client";

import { forwardRef } from "react";
import { Transformer } from "react-konva";
import type Konva from "konva";
import type { TransformerConfig } from "konva/lib/shapes/Transformer";
import type { KonvaNodeEvents } from "react-konva";

type KonvaTransformerProps = TransformerConfig & KonvaNodeEvents;

export const KonvaTransformer = forwardRef<
  Konva.Transformer,
  KonvaTransformerProps
>(function KonvaTransformer(props, ref) {
  return <Transformer ref={ref} {...props} />;
});
