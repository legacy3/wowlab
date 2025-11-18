import * as Schema from "effect/Schema";

import * as Branded from "@/Branded";

const SpellMiscSchema = Schema.Struct({
  ActiveIconFileDataID: Schema.Number,
  ActiveSpellVisualScript: Schema.Number,
  Attributes: Schema.Array(Schema.Number),
  CastingTimeIndex: Schema.Number,
  ContentTuningID: Schema.Number,
  DifficultyID: Schema.Number,
  DurationIndex: Schema.Number,
  ID: Schema.Number,
  LaunchDelay: Schema.Number,
  MinDuration: Schema.Number,
  PvPDurationIndex: Schema.Number,
  RangeIndex: Schema.Number,
  SchoolMask: Schema.Number, // TODO SchoolMaskSchema + 125?
  ShowFutureSpellPlayerConditionID: Schema.Number,
  Speed: Schema.Number,
  SpellIconFileDataID: Schema.Number,
  SpellID: Branded.SpellIDSchema,
  SpellVisualScript: Schema.Number,
});

type SpellMiscRow = Schema.Schema.Type<typeof SpellMiscSchema>;

export { SpellMiscSchema, type SpellMiscRow };
