import { Map } from "immutable";

import type { SpecSpellList, SpellSeed, SpellSeedSource } from "./types";

const normalizeKey = (key: string): string => key.toLowerCase();

const addSource = (
  sources: readonly SpellSeedSource[],
  source: SpellSeedSource,
): readonly SpellSeedSource[] => {
  const exists = sources.some(
    (candidate) =>
      candidate.classId === source.classId &&
      candidate.specId === source.specId &&
      candidate.key === source.key,
  );

  if (exists) {
    return sources;
  }

  return [...sources, source];
};

const addKey = (
  keys: readonly string[],
  key: string,
  shouldNormalize: boolean,
): readonly string[] => {
  const set = new Set(keys);
  set.add(shouldNormalize ? normalizeKey(key) : key);
  return Array.from(set).sort();
};

export const buildSpellSeedRegistry = (
  specs: ReadonlyArray<SpecSpellList>,
): Map<number, SpellSeed> => {
  return specs.reduce<Map<number, SpellSeed>>((registry, spec) => {
    let current = registry;

    for (const [key, spellId] of Object.entries(spec.spellList)) {
      const source: SpellSeedSource = {
        classId: spec.classId,
        key,
        specId: spec.specId,
      };

      const existing = current.get(spellId);

      if (existing) {
        current = current.set(spellId, {
          id: spellId,
          keys: addKey(existing.keys, key, false),
          normalizedKeys: addKey(existing.normalizedKeys, key, true),
          sources: addSource(existing.sources, source),
        });
      } else {
        current = current.set(spellId, {
          id: spellId,
          keys: [key],
          normalizedKeys: [normalizeKey(key)],
          sources: [source],
        });
      }
    }

    return current;
  }, Map<number, SpellSeed>());
};

export const buildSpellNameIndex = (
  specs: ReadonlyArray<SpecSpellList>,
): Record<string, number> => {
  const index: Record<string, number> = {};

  for (const spec of specs) {
    for (const [key, spellId] of Object.entries(spec.spellList)) {
      index[normalizeKey(key)] = spellId;
    }
  }

  return index;
};
