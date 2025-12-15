import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellMiscRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  Attributes_0: Schema.NumberFromString,
  Attributes_1: Schema.NumberFromString,
  Attributes_2: Schema.NumberFromString,
  Attributes_3: Schema.NumberFromString,
  Attributes_4: Schema.NumberFromString,
  Attributes_5: Schema.NumberFromString,
  Attributes_6: Schema.NumberFromString,
  Attributes_7: Schema.NumberFromString,
  Attributes_8: Schema.NumberFromString,
  Attributes_9: Schema.NumberFromString,
  Attributes_10: Schema.NumberFromString,
  Attributes_11: Schema.NumberFromString,
  Attributes_12: Schema.NumberFromString,
  Attributes_13: Schema.NumberFromString,
  Attributes_14: Schema.NumberFromString,
  Attributes_15: Schema.NumberFromString,
  DifficultyID: Schema.NumberFromString,
  CastingTimeIndex: Schema.NumberFromString,
  DurationIndex: Schema.NumberFromString,
  PvPDurationIndex: Schema.NumberFromString,
  RangeIndex: Schema.NumberFromString,
  SchoolMask: Schema.NumberFromString,
  Speed: Schema.NumberFromString,
  LaunchDelay: Schema.NumberFromString,
  MinDuration: Schema.NumberFromString,
  SpellIconFileDataID: Schema.NumberFromString,
  ActiveIconFileDataID: Schema.NumberFromString,
  ContentTuningID: Schema.NumberFromString,
  ShowFutureSpellPlayerConditionID: Schema.NumberFromString,
  SpellVisualScript: Schema.NumberFromString,
  ActiveSpellVisualScript: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
});

export type SpellMiscRow = Schema.Schema.Type<typeof SpellMiscRowSchema>;
