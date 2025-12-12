import * as Schema from "effect/Schema";

export const ChrRaceRacialAbilityRowSchema = Schema.Struct({
  _Order: Schema.NumberFromString,
  ChrRacesID: Schema.NumberFromString,
  Description_lang: Schema.NullOr(Schema.String),
  DescriptionShort_lang: Schema.NullOr(Schema.String),
  Icon: Schema.NumberFromString,
  ID: Schema.NumberFromString,
  Name_lang: Schema.NullOr(Schema.String),
});

export type ChrRaceRacialAbilityRow = Schema.Schema.Type<
  typeof ChrRaceRacialAbilityRowSchema
>;
