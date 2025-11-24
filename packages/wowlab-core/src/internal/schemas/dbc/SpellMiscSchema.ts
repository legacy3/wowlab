import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellMiscRowSchema = Schema.Struct({
  ActiveIconFileDataID: Schema.Number,
  ActiveSpellVisualScript: Schema.Number,
  Attributes_0: Schema.Number,
  Attributes_1: Schema.Number,
  Attributes_10: Schema.Number,
  Attributes_11: Schema.Number,
  Attributes_12: Schema.Number,
  Attributes_13: Schema.Number,
  Attributes_14: Schema.Number,
  Attributes_15: Schema.Number,
  Attributes_2: Schema.Number,
  Attributes_3: Schema.Number,
  Attributes_4: Schema.Number,
  Attributes_5: Schema.Number,
  Attributes_6: Schema.Number,
  Attributes_7: Schema.Number,
  Attributes_8: Schema.Number,
  Attributes_9: Schema.Number,
  CastingTimeIndex: Schema.Number,
  ContentTuningID: Schema.Number,
  DifficultyID: Schema.Number,
  DurationIndex: Schema.Number,
  ID: Schema.Number,
  LaunchDelay: Schema.Number,
  MinDuration: Schema.Number,
  PvPDurationIndex: Schema.Number,
  RangeIndex: Schema.Number,
  SchoolMask: Schema.Number,
  ShowFutureSpellPlayerConditionID: Schema.Number,
  Speed: Schema.Number,
  SpellIconFileDataID: Schema.Number,
  SpellID: Branded.SpellIDSchema,
  SpellVisualScript: Schema.Number,
});

export type SpellMiscRow = Schema.Schema.Type<typeof SpellMiscRowSchema>;
