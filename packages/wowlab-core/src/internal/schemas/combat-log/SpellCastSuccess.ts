import * as Schema from "effect/Schema";

import {
  CombatLogEventBaseSchema,
  SpellPrefixSchema,
} from "./CombatLogEvent.js";

export const SpellCastSuccessSchema = Schema.Struct({
  ...CombatLogEventBaseSchema.fields,
  ...SpellPrefixSchema.fields,
  subevent: Schema.Literal("SPELL_CAST_SUCCESS"),
});

export type SpellCastSuccess = Schema.Schema.Type<
  typeof SpellCastSuccessSchema
>;
