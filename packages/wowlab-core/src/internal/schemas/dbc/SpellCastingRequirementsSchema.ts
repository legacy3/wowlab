import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellCastingRequirementsRowSchema = Schema.Struct({
  FacingCasterFlags: Schema.Number,
  ID: Schema.Number,
  MinFactionID: Schema.Number,
  MinReputation: Schema.Number,
  RequiredAreasID: Schema.Number,
  RequiredAuraVision: Schema.Number,
  RequiresSpellFocus: Schema.Number,
  SpellID: Branded.SpellIDSchema,
});

export type SpellCastingRequirementsRow = Schema.Schema.Type<
  typeof SpellCastingRequirementsRowSchema
>;
