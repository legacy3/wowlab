import * as Entities from "@wowlab/core/Entities";
import * as Errors from "@wowlab/core/Errors";
import * as Schemas from "@wowlab/core/Schemas";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";

export interface SpellService {
  readonly cast: (
    spellId: Schemas.Branded.SpellID,
    casterId: Schemas.Branded.UnitID,
    targetId: Schemas.Branded.UnitID | null,
  ) => Effect.Effect<void, Errors.Cast | Errors.SpellNotFound>; // Removed UnitNotFound for now
}

export const SpellService = Context.GenericTag<SpellService>(
  "@wowlab/services/SpellService",
);
