import * as Schema from "effect/Schema";

import * as Branded from "@/Branded";

const SpellCooldownsSchema = Schema.Struct({
  CategoryRecoveryTime: Schema.Number.pipe(Schema.optional),
  ID: Schema.Number,
  RecoveryTime: Schema.Number,
  SpellID: Branded.SpellIDSchema,
  StartRecoveryTime: Schema.Number,
});

type SpellCooldownsRow = Schema.Schema.Type<typeof SpellCooldownsSchema>;

export { SpellCooldownsSchema, type SpellCooldownsRow };
