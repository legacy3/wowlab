import * as Profile from "@packages/innocent-domain/Profile";

import * as Spells from "@/Spells";

const SPEC_SPELL_LISTS = Spells.SPEC_SPELL_LISTS;
const SPEC_SPELL_OVERRIDES = Spells.SPEC_SPELL_OVERRIDES;

const createSharedBundles = (): readonly Profile.Types.ProfileBundle[] => [
  Profile.Factory.makeProfileBundle({ id: "player-base" }),
];

const createClassBundles = (): readonly Profile.Types.ProfileBundle[] => {
  const byClass = new Map<string, Profile.Types.ProfileBundle>();

  for (const spec of SPEC_SPELL_LISTS) {
    if (!byClass.has(spec.classId)) {
      byClass.set(
        spec.classId,
        Profile.Factory.makeProfileBundle({ id: spec.classId }),
      );
    }
  }

  return Array.from(byClass.values());
};

const createSpecBundles = (): readonly Profile.Types.ProfileBundle[] =>
  SPEC_SPELL_LISTS.map((spec) => {
    const overrides = SPEC_SPELL_OVERRIDES[spec.specId] ?? [];

    return Profile.Factory.makeProfileBundle({
      id: spec.specId,
      spellOverrides: overrides.map((entry) => [entry.spellId, entry.override]),
    });
  });

const sharedBundles = createSharedBundles();
const classBundles = createClassBundles();
const specBundles = createSpecBundles();

export const PROFILE_BUNDLE_LIST: readonly Profile.Types.ProfileBundle[] =
  Object.freeze([...sharedBundles, ...classBundles, ...specBundles]);

export const PROFILE_BUNDLE_REGISTRY: ReadonlyMap<
  string,
  Profile.Types.ProfileBundle
> = new Map(PROFILE_BUNDLE_LIST.map((bundle) => [bundle.id, bundle] as const));
