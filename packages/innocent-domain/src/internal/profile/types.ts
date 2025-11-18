import { Map } from "immutable";

import * as Entities from "@/Entities";

import type { ModifierRuntime } from "./runtime";

export interface ComposedProfile {
  readonly auras: readonly number[];
  readonly bundleIds: readonly string[];
  readonly modifiers: readonly SpellModifierBuilder[];
  readonly signature: string;
  readonly spellOverrides: SpellOverrideMap;
  readonly talents: readonly number[];
}

export interface MakeProfileBundleOptions {
  readonly auras?: ReadonlyArray<number>;
  readonly id: string;
  readonly modifiers?: ReadonlyArray<SpellModifierBuilder>;
  readonly spellOverrides?: ReadonlyArray<
    readonly [number, SpellOverrideClass]
  >;
  readonly talents?: ReadonlyArray<number>;
}

export interface ProfileBundle {
  readonly auras: readonly number[];
  readonly id: string;
  readonly modifiers: readonly SpellModifierBuilder[];
  readonly spellOverrides: SpellOverrideMap;
  readonly talents: readonly number[];
}

export type SpellModifierBuilder = (
  runtime: ModifierRuntime,
) => Entities.Types.SpellModifier;

export type SpellOverrideClass = typeof Entities.Spell;

export type SpellOverrideMap = Map<number, SpellOverrideClass>;
