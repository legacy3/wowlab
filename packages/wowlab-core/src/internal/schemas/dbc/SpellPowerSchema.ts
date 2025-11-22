import * as Schema from "effect/Schema";

export const SpellPowerRowSchema = Schema.Struct({
  ID: Schema.Number,
  ManaCost: Schema.Number,
  PowerCostPct: Schema.Number,
  PowerType: Schema.Number,
  SpellID: Schema.Number,
});

export type SpellPowerRow = Schema.Schema.Type<typeof SpellPowerRowSchema>;
