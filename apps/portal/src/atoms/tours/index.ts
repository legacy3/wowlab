"use client";

import { atomWithStorage } from "jotai/utils";

export type TourId = "talents-import";

export const completedToursAtom = atomWithStorage<TourId[]>(
  "wowlab-completed-tours",
  [],
);
