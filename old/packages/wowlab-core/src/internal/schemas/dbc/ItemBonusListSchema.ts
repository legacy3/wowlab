import * as Schema from "effect/Schema";

export const ItemBonusListRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  Flags: Schema.NumberFromString,
});

export type ItemBonusListRow = Schema.Schema.Type<
  typeof ItemBonusListRowSchema
>;
