import type { RotationDefinition } from "../types";
import { BeastMasteryRotation } from "./beast-mastery";

export interface RotationEntry {
  id: string;
  name: string;
  class: string;
  spec: string;
  rotation: RotationDefinition;
}

const ROTATION_REGISTRY: RotationEntry[] = [
  {
    id: "hunter-beast-mastery",
    name: "Beast Mastery Hunter",
    class: "Hunter",
    spec: "Beast Mastery",
    rotation: BeastMasteryRotation,
  },
];

export function getRotation(id: string): RotationDefinition | undefined {
  return ROTATION_REGISTRY.find((entry) => entry.id === id)?.rotation;
}

export function getRotationBySpec(
  wowClass: string,
  spec: string,
): RotationEntry | undefined {
  return ROTATION_REGISTRY.find(
    (entry) =>
      entry.class.toLowerCase() === wowClass.toLowerCase() &&
      entry.spec.toLowerCase() === spec.toLowerCase(),
  );
}

export function getRotationsForClass(wowClass: string): RotationEntry[] {
  return ROTATION_REGISTRY.filter(
    (entry) => entry.class.toLowerCase() === wowClass.toLowerCase(),
  );
}

export function listRotations(): RotationEntry[] {
  return ROTATION_REGISTRY;
}

export { BeastMasteryRotation };
