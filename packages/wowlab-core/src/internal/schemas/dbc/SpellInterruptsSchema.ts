import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellInterruptsRowSchema = Schema.Struct({
  AuraInterruptFlags_0: Schema.Number,
  AuraInterruptFlags_1: Schema.Number,
  ChannelInterruptFlags_0: Schema.Number,
  ChannelInterruptFlags_1: Schema.Number,
  DifficultyID: Schema.Number,
  ID: Schema.Number,
  InterruptFlags: Schema.Number,
  SpellID: Branded.SpellIDSchema,
});

export type SpellInterruptsRow = Schema.Schema.Type<
  typeof SpellInterruptsRowSchema
>;
