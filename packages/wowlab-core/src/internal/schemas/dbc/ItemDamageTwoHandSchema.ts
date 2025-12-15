import * as Schema from "effect/Schema";

export const ItemDamageTwoHandRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  ItemLevel: Schema.NumberFromString,
  Quality_0: Schema.NumberFromString,
  Quality_1: Schema.NumberFromString,
  Quality_2: Schema.NumberFromString,
  Quality_3: Schema.NumberFromString,
  Quality_4: Schema.NumberFromString,
  Quality_5: Schema.NumberFromString,
  Quality_6: Schema.NumberFromString,
});

export type ItemDamageTwoHandRow = Schema.Schema.Type<
  typeof ItemDamageTwoHandRowSchema
>;
