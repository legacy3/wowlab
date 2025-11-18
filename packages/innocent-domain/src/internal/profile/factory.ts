import { Map } from "immutable";

import type {
  MakeProfileBundleOptions,
  ProfileBundle,
  SpellOverrideClass,
  SpellOverrideMap,
} from "./types";

const freezeArray = <A>(values: ReadonlyArray<A>): readonly A[] =>
  Object.freeze([...values]);

const makeSpellOverrideMap = (
  entries: ReadonlyArray<readonly [number, SpellOverrideClass]>,
): SpellOverrideMap => Map<number, SpellOverrideClass>(entries);

export const makeProfileBundle = ({
  auras = [],
  id,
  modifiers = [],
  spellOverrides = [],
  talents = [],
}: MakeProfileBundleOptions): ProfileBundle => ({
  auras: freezeArray(auras),
  id,
  modifiers: freezeArray(modifiers),
  spellOverrides: makeSpellOverrideMap(spellOverrides),
  talents: freezeArray(talents),
});
