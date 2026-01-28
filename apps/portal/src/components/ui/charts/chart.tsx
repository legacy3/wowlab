"use client";

import type { ComponentProps } from "react";

import { ark } from "@ark-ui/react/factory";
import { styled } from "styled-system/jsx";
import { chart } from "styled-system/recipes";

export type ChartProps = ComponentProps<typeof Chart>;
export const Chart = styled(ark.div, chart);

export const chartColors = {
  1: "var(--chart-1)",
  2: "var(--chart-2)",
  3: "var(--chart-3)",
  4: "var(--chart-4)",
  5: "var(--chart-5)",
  axis: "var(--chart-axis)",
  grid: "var(--chart-grid)",
  text: "var(--chart-text)",
} as const;
