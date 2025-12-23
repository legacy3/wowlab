"use client";

import { Layer } from "react-konva";
import type { LayerConfig } from "konva/lib/Layer";

type KonvaLayerProps = LayerConfig & {
  children?: React.ReactNode;
};

export function KonvaLayer(props: KonvaLayerProps) {
  return <Layer {...props} />;
}
