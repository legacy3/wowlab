import * as Schema from "effect/Schema";

import * as Branded from "../Branded.js";

export const SpellMiscRowSchema = Schema.Struct({
  ActiveIconFileDataID: Schema.NumberFromString,
  ActiveSpellVisualScript: Schema.NumberFromString,
  Attributes_0: Schema.NumberFromString,
  Attributes_1: Schema.NumberFromString,
  Attributes_10: Schema.NumberFromString,
  Attributes_11: Schema.NumberFromString,
  Attributes_12: Schema.NumberFromString,
  Attributes_13: Schema.NumberFromString,
  Attributes_14: Schema.NumberFromString,
  Attributes_15: Schema.NumberFromString,
  Attributes_2: Schema.NumberFromString,
  Attributes_3: Schema.NumberFromString,
  Attributes_4: Schema.NumberFromString,
  Attributes_5: Schema.NumberFromString,
  Attributes_6: Schema.NumberFromString,
  Attributes_7: Schema.NumberFromString,
  Attributes_8: Schema.NumberFromString,
  Attributes_9: Schema.NumberFromString,
  CastingTimeIndex: Schema.NumberFromString,
  ContentTuningID: Schema.NumberFromString,
  DifficultyID: Schema.NumberFromString,
  DurationIndex: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  LaunchDelay: Schema.NumberFromString,
  MinDuration: Schema.NumberFromString,
  PvPDurationIndex: Schema.NumberFromString,
  RangeIndex: Schema.NumberFromString,
  SchoolMask: Schema.NumberFromString,
  ShowFutureSpellPlayerConditionID: Schema.NumberFromString,
  Speed: Schema.NumberFromString,
  SpellIconFileDataID: Schema.NumberFromString,
  SpellID: Branded.SpellIDSchema,
  SpellVisualScript: Schema.NumberFromString,
});

export type SpellMiscRow = Schema.Schema.Type<typeof SpellMiscRowSchema>;
