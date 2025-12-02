import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellLearnSpellRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  LearnSpellID: Schema.NumberFromString,
  OverridesSpellID: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
});

export type SpellLearnSpellRow = Schema.Schema.Type<
  typeof SpellLearnSpellRowSchema
>;
