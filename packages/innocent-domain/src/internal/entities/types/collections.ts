import type { Map } from "immutable";

export interface EntityCollection<
  TEntity,
  TMeta,
  TKey extends string | number,
> {
  readonly all: Map<TKey, TEntity>;
  readonly meta: TMeta;
}

export type EntityMap<T> = Map<string, T>;
