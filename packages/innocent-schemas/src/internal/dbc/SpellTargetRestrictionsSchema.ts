import * as Schema from "effect/Schema";

import * as Branded from "@/Branded";

const SpellTargetRestrictionsSchema = Schema.Struct({
  ConeDegrees: Schema.Number,
  ID: Schema.Number,
  MaxTargets: Schema.Number.pipe(Schema.optional),
  SpellID: Branded.SpellIDSchema,
  Width: Schema.Number.pipe(Schema.optional),
});

type SpellTargetRestrictionsRow = Schema.Schema.Type<
  typeof SpellTargetRestrictionsSchema
>;

export { SpellTargetRestrictionsSchema, type SpellTargetRestrictionsRow };
