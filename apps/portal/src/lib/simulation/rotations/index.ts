import type { RotationDefinition } from "../types";
import { BeastMasteryRotation } from "./beast-mastery";

const ROTATIONS: Record<string, RotationDefinition> = {
  "beast-mastery": BeastMasteryRotation,
};

export function getRotation(name: string): RotationDefinition | undefined {
  return ROTATIONS[name];
}

export function listRotations(): string[] {
  return Object.keys(ROTATIONS);
}

export { BeastMasteryRotation };
