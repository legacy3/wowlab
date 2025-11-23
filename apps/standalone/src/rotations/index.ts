import { BeastMasteryRotation } from "./beast-mastery.js";
// import { FireMageRotation } from "./fire-mage.js";

export const rotations = {
  "beast-mastery": BeastMasteryRotation,
  // "fire-mage": FireMageRotation,
} as const;

export type RotationName = keyof typeof rotations;
