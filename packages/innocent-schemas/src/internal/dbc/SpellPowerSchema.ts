import * as Schema from "effect/Schema";

import * as Branded from "@/Branded";
import * as Enums from "@/Enums";

const SpellPowerSchema = Schema.Struct({
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
  PowerType: Enums.PowerTypeSchema,
  RequiredAuraSpellID: Schema.Number,
  SpellID: Branded.SpellIDSchema,
});

type SpellPowerRow = Schema.Schema.Type<typeof SpellPowerSchema>;

export { SpellPowerSchema, type SpellPowerRow };
