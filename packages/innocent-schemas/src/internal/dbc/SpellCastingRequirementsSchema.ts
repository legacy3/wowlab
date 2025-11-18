import * as Schema from "effect/Schema";

import * as Branded from "@/Branded";

const SpellCastingRequirementsSchema = Schema.Struct({
  FacingCasterFlags: Schema.Number,
  ID: Schema.Number,
  SpellID: Branded.SpellIDSchema,
});

type SpellCastingRequirementsRow = Schema.Schema.Type<
  typeof SpellCastingRequirementsSchema
>;

export { SpellCastingRequirementsSchema, type SpellCastingRequirementsRow };
