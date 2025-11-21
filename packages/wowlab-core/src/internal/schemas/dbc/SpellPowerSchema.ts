import * as Schema from "effect/Schema";

export const SpellPowerRowSchema = Schema.Struct({
  ID: Schema.Number,
  SpellID: Schema.Number,
  ManaCost: Schema.Number,
  PowerCostPct: Schema.Number,
  PowerType: Schema.Number,
});

export type SpellPowerRow = Schema.Schema.Type<typeof SpellPowerRowSchema>;
