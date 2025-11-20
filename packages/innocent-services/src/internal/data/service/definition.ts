import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Entities from "@packages/innocent-domain/Entities";

export interface SpellRequestOptions {
  readonly profileIds?: ReadonlyArray<string>;
}

export interface SpellInfoService {
  readonly getSpell: (
    spellId: number,
    options?: SpellRequestOptions,
  ) => Effect.Effect<Entities.SpellInfo>;
}

export const SpellInfoService =
  Context.GenericTag<SpellInfoService>("SpellInfoService");
