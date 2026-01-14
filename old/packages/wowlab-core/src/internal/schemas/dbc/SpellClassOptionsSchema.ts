import * as Schema from "effect/Schema";

export const SpellClassOptionsRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  SpellID: Schema.NumberFromString,
  ModalNextSpell: Schema.NumberFromString,
  SpellClassSet: Schema.NumberFromString,
  SpellClassMask_0: Schema.NumberFromString,
  SpellClassMask_1: Schema.NumberFromString,
  SpellClassMask_2: Schema.NumberFromString,
  SpellClassMask_3: Schema.NumberFromString,
});

export type SpellClassOptionsRow = Schema.Schema.Type<
  typeof SpellClassOptionsRowSchema
>;
