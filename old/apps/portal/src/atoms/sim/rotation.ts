"use client";

import { atom } from "jotai";

/**
 * Selected rotation ID from the database.
 * When null, auto-detect based on character class/spec.
 */
export const selectedRotationIdAtom = atom<string | null>(null);

/**
 * Whether the current rotation is auto-detected vs. manually selected.
 */
export const isRotationAutoDetectedAtom = atom<boolean>((get) => {
  return get(selectedRotationIdAtom) === null;
});

/**
 * Action atom to set rotation selection.
 * Pass null to reset to auto-detection.
 */
export const setRotationIdAtom = atom(
  null,
  (_get, set, rotationId: string | null) => {
    set(selectedRotationIdAtom, rotationId);
  },
);
