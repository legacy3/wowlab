"use client";

import { atomWithStorage } from "jotai/utils";

export type TourId =
  | "talents-import"
  | "simulate-intro"
  | "rotations-browse"
  | "rotation-editor"
  | "lab-overview"
  | "optimize-intro"
  | "rankings-intro";

export const completedToursAtom = atomWithStorage<TourId[]>(
  "wowlab-completed-tours",
  [],
);
