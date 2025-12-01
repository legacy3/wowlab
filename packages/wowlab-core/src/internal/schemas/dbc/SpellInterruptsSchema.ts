import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellInterruptsRowSchema = Schema.Struct({
  AuraInterruptFlags_0: Schema.NumberFromString,
  AuraInterruptFlags_1: Schema.NumberFromString,
  ChannelInterruptFlags_0: Schema.NumberFromString,
  ChannelInterruptFlags_1: Schema.NumberFromString,
  DifficultyID: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  InterruptFlags: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
});

export type SpellInterruptsRow = Schema.Schema.Type<
  typeof SpellInterruptsRowSchema
>;
