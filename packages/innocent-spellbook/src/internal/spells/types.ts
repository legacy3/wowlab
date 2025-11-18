import * as Entities from "@packages/innocent-domain/Entities";
import * as Profile from "@packages/innocent-domain/Profile";
import * as Branded from "@packages/innocent-schemas/Branded";

export interface ProfileModifierBundle {
  readonly modifiers: readonly Profile.Types.SpellModifierBuilder[];
  readonly overrides: ReadonlyMap<number, typeof Entities.Spell>;
}

export interface SpecSpellList {
  readonly classId: string;
  readonly className: string;
  readonly specId: string;
  readonly specName: string;
  readonly spellList: Record<string, Branded.SpellID>;
}

export interface SpellOverrideEntry {
  readonly override: typeof Entities.Spell;
  readonly spellId: number;
}

export interface SpellSeed {
  readonly id: Branded.SpellID;
  readonly keys: readonly string[];
  readonly normalizedKeys: readonly string[];
  readonly sources: readonly SpellSeedSource[];
}

export interface SpellSeedSource {
  readonly classId: string;
  readonly key: string;
  readonly specId: string;
}
