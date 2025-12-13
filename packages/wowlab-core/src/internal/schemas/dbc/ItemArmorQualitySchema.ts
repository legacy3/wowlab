import * as Schema from "effect/Schema";

export const ItemArmorQualityRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  Qualitymod_0: Schema.NumberFromString,
  Qualitymod_1: Schema.NumberFromString,
  Qualitymod_2: Schema.NumberFromString,
  Qualitymod_3: Schema.NumberFromString,
  Qualitymod_4: Schema.NumberFromString,
  Qualitymod_5: Schema.NumberFromString,
  Qualitymod_6: Schema.NumberFromString,
});

export type ItemArmorQualityRow = Schema.Schema.Type<
  typeof ItemArmorQualityRowSchema
>;
