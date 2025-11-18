import * as Schema from "effect/Schema";

import * as Branded from "@/Branded";

const SpellAuraOptionsSchema = Schema.Struct({
  CumulativeAura: Schema.Number,
  DifficultyID: Schema.Number,
  ID: Schema.Number,
  ProcCategoryRecovery: Schema.Number,
  ProcChance: Schema.Number,
  ProcCharges: Schema.Number,
  ProcTypeMask: Schema.Array(Schema.Number),
  SpellID: Branded.SpellIDSchema,
  SpellProcsPerMinuteID: Schema.Number,
});

type SpellAuraOptionsRow = Schema.Schema.Type<typeof SpellAuraOptionsSchema>;

export { SpellAuraOptionsSchema, type SpellAuraOptionsRow };
