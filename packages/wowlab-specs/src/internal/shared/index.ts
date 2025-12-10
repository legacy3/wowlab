export * from "./events.js";
export * from "./register.js";
export * from "./types.js";

import type { ClassDefinition, SpecDefinition } from "./types.js";

// TODO Move this not sure where yet
export function getAllSupportedSpellIds(
  classes: readonly ClassDefinition[],
): Set<number> {
  const ids = new Set<number>();

  for (const cls of classes) {
    for (const id of getClassSupportedSpellIds(cls)) {
      ids.add(id);
    }
  }

  return ids;
}

// TODO Move this not sure where yet
export function getClassSupportedSpellIds(cls: ClassDefinition): Set<number> {
  const ids = new Set<number>();

  for (const spec of cls.specs) {
    for (const handler of spec.handlers) {
      ids.add(handler.spellId);
    }
  }

  return ids;
}

// TODO Move this not sure where yet
export function getSpecSupportedSpellIds(spec: SpecDefinition): Set<number> {
  return new Set(spec.handlers.map((h) => h.spellId));
}
