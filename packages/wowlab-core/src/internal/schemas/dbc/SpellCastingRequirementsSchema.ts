import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellCastingRequirementsRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
  FacingCasterFlags: Schema.NumberFromString,
  MinFactionID: Schema.NumberFromString,
  MinReputation: Schema.NumberFromString,
  RequiredAreasID: Schema.NumberFromString,
  RequiredAuraVision: Schema.NumberFromString,
  RequiresSpellFocus: Schema.NumberFromString,
});

export type SpellCastingRequirementsRow = Schema.Schema.Type<
  typeof SpellCastingRequirementsRowSchema
>;
