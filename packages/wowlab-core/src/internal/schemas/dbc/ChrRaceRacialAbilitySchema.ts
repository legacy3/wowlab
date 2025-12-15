import * as Schema from "effect/Schema";

export const ChrRaceRacialAbilityRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  Name_lang: Schema.NullOr(Schema.String),
  Description_lang: Schema.NullOr(Schema.String),
  DescriptionShort_lang: Schema.NullOr(Schema.String),
  Icon: Schema.NumberFromString,
  _Order: Schema.NumberFromString,
  ChrRacesID: Schema.NumberFromString,
});

export type ChrRaceRacialAbilityRow = Schema.Schema.Type<
  typeof ChrRaceRacialAbilityRowSchema
>;
