import * as Schema from "effect/Schema";

import {
  CombatLogEventBaseSchema,
  SpellPrefixSchema,
} from "./CombatLogEvent.js";

export const SpellEnergizeSchema = Schema.Struct({
  ...CombatLogEventBaseSchema.fields,
  ...SpellPrefixSchema.fields,
  amount: Schema.Number,
  overEnergize: Schema.Number,
  powerType: Schema.Number,
  subevent: Schema.Literal("SPELL_ENERGIZE"),
});

export type SpellEnergize = Schema.Schema.Type<typeof SpellEnergizeSchema>;
