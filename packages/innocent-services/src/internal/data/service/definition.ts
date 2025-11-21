import * as Entities from "@packages/innocent-domain/Entities";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";

export interface SpellInfoService {
  readonly getSpell: (
    spellId: number,
    options?: SpellRequestOptions,
  ) => Effect.Effect<Entities.SpellInfo>;
}

export interface SpellRequestOptions {
  readonly profileIds?: ReadonlyArray<string>;
}

export const SpellInfoService =
  Context.GenericTag<SpellInfoService>("SpellInfoService");
