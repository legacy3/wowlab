"use client";

import { forwardRef } from "react";
import { Group } from "react-konva";
import type Konva from "konva";
import type { GroupConfig } from "konva/lib/Group";
import type { KonvaNodeEvents } from "react-konva";

type KonvaGroupProps = GroupConfig &
  KonvaNodeEvents & {
    children?: React.ReactNode;
  };

export const KonvaGroup = forwardRef<Konva.Group, KonvaGroupProps>(
  function KonvaGroup(props, ref) {
    return <Group ref={ref} {...props} />;
  },
);
