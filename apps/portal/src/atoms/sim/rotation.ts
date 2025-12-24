"use client";

import { atom } from "jotai";
import {
  getRotationBySpec,
  listRotations,
  type RotationEntry,
} from "@/lib/simulation/rotations";
import { parsedCharacterAtom } from "./character";

/**
 * User-selected rotation ID override.
 * When null, the rotation is auto-detected from the character spec.
 */
export const selectedRotationIdAtom = atom<string | null>(null);

/**
 * Derived atom that returns the current rotation entry.
 * Priority:
 * 1. User-selected rotation (if set)
 * 2. Auto-detected from character class/spec
 * 3. null if no character or no matching rotation
 */
export const currentRotationAtom = atom<RotationEntry | null>((get) => {
  const selectedId = get(selectedRotationIdAtom);
  const parsedData = get(parsedCharacterAtom);

  // If user explicitly selected a rotation, use that
  if (selectedId) {
    const rotations = listRotations();
    return rotations.find((r) => r.id === selectedId) ?? null;
  }

  // Auto-detect from character spec
  if (parsedData) {
    const { character } = parsedData;
    if (character.spec) {
      return getRotationBySpec(character.class, character.spec) ?? null;
    }
  }

  return null;
});

/**
 * Available rotations for the current character's class.
 * Returns all rotations if no character is loaded.
 */
export const availableRotationsAtom = atom<RotationEntry[]>((get) => {
  const parsedData = get(parsedCharacterAtom);

  if (parsedData) {
    const { character } = parsedData;
    // Return all rotations for the character's class
    return listRotations().filter(
      (r) => r.class.toLowerCase() === character.class.toLowerCase(),
    );
  }

  // No character loaded - return all rotations
  return listRotations();
});

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
export const setRotationAtom = atom(
  null,
  (_get, set, rotationId: string | null) => {
    set(selectedRotationIdAtom, rotationId);
  },
);
