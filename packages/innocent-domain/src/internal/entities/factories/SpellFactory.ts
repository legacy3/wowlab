import * as Spell from "@packages/innocent-schemas/Spell";
import { Map as ImmutableMap } from "immutable";

import * as Profile from "@/Profile";

import type { SpellModifier } from "../types/SpellModifier";

import { Spell as SpellEntity } from "../Spell";
import { SpellInfo } from "../SpellInfo";

const EMPTY_PROFILE: Profile.Types.ComposedProfile = {
  auras: [],
  bundleIds: [],
  modifiers: [],
  signature: "base",
  spellOverrides: ImmutableMap<number, Profile.Types.SpellOverrideClass>(),
  talents: [],
};

const instantiateBuilders = (
  builders: ReadonlyArray<Profile.Types.SpellModifierBuilder>,
  runtime: Profile.Runtime.ModifierRuntime,
): readonly SpellModifier[] => builders.map((builder) => builder(runtime));

const extractModifiers = (
  SpellClass: Profile.Types.SpellOverrideClass,
  runtime: Profile.Runtime.ModifierRuntime,
): readonly SpellModifier[] => {
  if ("MODIFIERS" in SpellClass) {
    const builders =
      SpellClass.MODIFIERS as ReadonlyArray<Profile.Types.SpellModifierBuilder>;
    return instantiateBuilders(builders, runtime);
  }
  return [];
};

const dedupeModifiers = (
  groups: ReadonlyArray<ReadonlyArray<SpellModifier>>,
): readonly SpellModifier[] => {
  const seen = new Set<string>();
  const ordered: SpellModifier[] = [];

  for (const group of groups) {
    for (const modifier of group) {
      if (seen.has(modifier.name)) {
        continue;
      }

      seen.add(modifier.name);
      ordered.push(modifier);
    }
  }

  return Object.freeze([...ordered]);
};

interface BuildSpellInfoParams {
  readonly baseModifiers?: ReadonlyArray<SpellModifier>;
  readonly data: Spell.SpellDataFlat;
  readonly modifierRuntime: Profile.Runtime.ModifierRuntime;
  readonly profile?: Profile.Types.ComposedProfile;
}

export const SpellFactory = {
  build: ({
    baseModifiers = [],
    data,
    modifierRuntime,
    profile = EMPTY_PROFILE,
  }: BuildSpellInfoParams): SpellInfo => {
    const spellOverrides = profile.spellOverrides;
    const SpellClass = spellOverrides.get(data.id) ?? SpellEntity;
    const customModifiers = extractModifiers(SpellClass, modifierRuntime);
    const profileModifiers = instantiateBuilders(
      profile.modifiers,
      modifierRuntime,
    );

    const modifiers = dedupeModifiers([
      profileModifiers,
      baseModifiers,
      customModifiers,
    ]);

    return SpellInfo.create({
      ...data,
      modifiers,
    });
  },
};
