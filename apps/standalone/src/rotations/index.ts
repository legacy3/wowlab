import { FireMageRotation } from "./fire-mage.js";

export const rotations = {
  "fire-mage": FireMageRotation,
} as const;

export type RotationName = keyof typeof rotations;
