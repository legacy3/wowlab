import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellInterruptsRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  DifficultyID: Schema.NumberFromString,
  InterruptFlags: Schema.NumberFromString,
  AuraInterruptFlags_0: Schema.NumberFromString,
  AuraInterruptFlags_1: Schema.NumberFromString,
  ChannelInterruptFlags_0: Schema.NumberFromString,
  ChannelInterruptFlags_1: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
});

export type SpellInterruptsRow = Schema.Schema.Type<
  typeof SpellInterruptsRowSchema
>;
