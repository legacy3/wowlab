import * as Schema from "effect/Schema";

export const ItemSetRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  Name_lang: Schema.NullOr(Schema.String),
  SetFlags: Schema.NumberFromString,
  RequiredSkill: Schema.NumberFromString,
  RequiredSkillRank: Schema.NumberFromString,
  ItemID_0: Schema.NumberFromString,
  ItemID_1: Schema.NumberFromString,
  ItemID_2: Schema.NumberFromString,
  ItemID_3: Schema.NumberFromString,
  ItemID_4: Schema.NumberFromString,
  ItemID_5: Schema.NumberFromString,
  ItemID_6: Schema.NumberFromString,
  ItemID_7: Schema.NumberFromString,
  ItemID_8: Schema.NumberFromString,
  ItemID_9: Schema.NumberFromString,
  ItemID_10: Schema.NumberFromString,
  ItemID_11: Schema.NumberFromString,
  ItemID_12: Schema.NumberFromString,
  ItemID_13: Schema.NumberFromString,
  ItemID_14: Schema.NumberFromString,
  ItemID_15: Schema.NumberFromString,
  ItemID_16: Schema.NumberFromString,
});

export type ItemSetRow = Schema.Schema.Type<typeof ItemSetRowSchema>;
