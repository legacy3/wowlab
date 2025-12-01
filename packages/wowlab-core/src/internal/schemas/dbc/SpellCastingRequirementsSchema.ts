import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellCastingRequirementsRowSchema = Schema.Struct({
  FacingCasterFlags: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  MinFactionID: Schema.NumberFromString,
  MinReputation: Schema.NumberFromString,
  RequiredAreasID: Schema.NumberFromString,
  RequiredAuraVision: Schema.NumberFromString,
  RequiresSpellFocus: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
});

export type SpellCastingRequirementsRow = Schema.Schema.Type<
  typeof SpellCastingRequirementsRowSchema
>;
