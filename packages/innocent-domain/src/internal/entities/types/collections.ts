import { List, Map } from "immutable";

import type { Aura } from "../Aura";
import type { Projectile } from "../Projectile";
import type { Spell } from "../Spell";
import type { Unit } from "../Unit";

export type AuraMap = Map<number, Aura>;

export interface EntityCollection<
  TEntity,
  TMeta,
  TKey extends string | number,
> {
  readonly all: Map<TKey, TEntity>;
  readonly meta: TMeta;
}

export type EntityMap<T> = Map<string, T>;

export const createUnitMap = (): Map<string, Unit> => {
  return Map<string, Unit>();
};

export const createSpellMap = (): Map<number, Spell> => {
  return Map<number, Spell>();
};

export const createAuraMap = (): Map<number, Aura> => {
  return Map<number, Aura>();
};

export const createProjectileList = (): List<Projectile> => {
  return List<Projectile>();
};
