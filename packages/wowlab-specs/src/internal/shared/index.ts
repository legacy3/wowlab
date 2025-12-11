export * from "./events.js";
export * from "./register.js";
export * from "./types.js";

import type { ClassDefinition, SpecDefinition } from "./types.js";

export interface HandlerInfo {
  readonly className: string;
  readonly handlerId: string;
  readonly specId: string;
  readonly specName: string;
  readonly spellId: number;
}

export function getAllHandlerInfo(
  classes: readonly ClassDefinition[],
): HandlerInfo[] {
  const handlers: HandlerInfo[] = [];

  for (const cls of classes) {
    for (const spec of cls.specs) {
      for (const handler of spec.handlers) {
        handlers.push({
          className: cls.name,
          handlerId: handler.id,
          specId: spec.id,
          specName: spec.name,
          spellId: handler.spellId,
        });
      }
    }
  }

  return handlers;
}

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

export function getClassSupportedSpellIds(cls: ClassDefinition): Set<number> {
  const ids = new Set<number>();

  for (const spec of cls.specs) {
    for (const handler of spec.handlers) {
      ids.add(handler.spellId);
    }
  }

  return ids;
}

export function getSpecSupportedSpellIds(spec: SpecDefinition): Set<number> {
  return new Set(spec.handlers.map((h) => h.spellId));
}
