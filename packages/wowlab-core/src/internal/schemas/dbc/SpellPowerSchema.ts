import * as Schema from "effect/Schema";

export const SpellPowerRowSchema = Schema.Struct({
  AltPowerBarID: Schema.Number,
  ID: Schema.Number,
  ManaCost: Schema.Number,
  ManaCostPerLevel: Schema.Number,
  ManaPerSecond: Schema.Number,
  OptionalCost: Schema.Number,
  OptionalCostPct: Schema.Number,
  OrderIndex: Schema.Number,
  PowerCostMaxPct: Schema.Number,
  PowerCostPct: Schema.Number,
  PowerDisplayID: Schema.Number,
  PowerPctPerSecond: Schema.Number,
  PowerType: Schema.Number,
  RequiredAuraSpellID: Schema.Number,
  SpellID: Schema.Number,
});

export type SpellPowerRow = Schema.Schema.Type<typeof SpellPowerRowSchema>;
