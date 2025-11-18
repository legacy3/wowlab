"use client";

import { atomWithStorage } from "jotai/utils";

export type WorkbenchCardId =
  | "configuration"
  | "quick-actions"
  | "recent-experiments"
  | "variables";

const DEFAULT_WORKBENCH_ORDER: WorkbenchCardId[] = [
  "configuration",
  "quick-actions",
  "recent-experiments",
  "variables",
];

export const workbenchCardOrderAtom = atomWithStorage<WorkbenchCardId[]>(
  "workbench-card-order",
  [...DEFAULT_WORKBENCH_ORDER],
);
